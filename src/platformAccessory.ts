import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { OsojiVacuumPlatform } from './platform';
import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import { TuyaDeviceStatus } from './types';
import { withRetry, validateTuyaResponse, TuyaAPIError } from './utils';

export class OsojiVacuumAccessory {
  private service: Service;
  private tuya: TuyaContext;

  constructor(
    private readonly platform: OsojiVacuumPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.platform.log.info('Initializing OSOJI vacuum accessory...');

    // Inicializar cliente Tuya
    this.tuya = new TuyaContext({
      baseUrl: this.platform.config.endpoint,
      accessKey: this.platform.config.accessKey,
      secretKey: this.platform.config.secretKey,
    });

    if (this.platform.config.debug) {
      this.platform.log.info('[DEBUG] Configuración de Tuya Client:');
      this.platform.log.info(`[DEBUG] - Endpoint: ${this.platform.config.endpoint}`);
      this.platform.log.info(`[DEBUG] - Device ID: ${this.platform.config.deviceId}`);
      this.platform.log.info(`[DEBUG] - Access Key: ${this.platform.config.accessKey.substring(0, 8)}...`);
    }

    // Configurar información del accesorio
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Osoji')
      .setCharacteristic(this.platform.Characteristic.Model, 'X420')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.platform.config.deviceId);

    // Obtener o crear el servicio Switch
    this.service = this.accessory.getService(this.platform.Service.Switch)
      || this.accessory.addService(this.platform.Service.Switch);

    // Configurar el nombre del servicio
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'OSOJI');

    // Registrar handlers para el Switch
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    this.platform.log.info('OSOJI vacuum accessory initialized successfully');

    // Realizar una prueba de conexión inicial (solo si debug está activado)
    if (this.platform.config.debug) {
      this.testConnection();
    }
  }

  /**
   * Prueba la conexión con la API de Tuya
   */
  private async testConnection() {
    try {
      this.platform.log.info('[DEBUG] Probando conexión con Tuya API...');

      const response = await withRetry(
        async () => {
          const result = await this.tuya.request({
            path: `/v1.0/devices/${this.platform.config.deviceId}`,
            method: 'GET',
          });
          validateTuyaResponse(result);
          return result;
        },
        {
          maxRetries: 2,
          initialDelayMs: 500,
          timeoutMs: 10000,
        },
        this.platform.log,
      );

      this.platform.log.info('[DEBUG] ✓ Conexión exitosa con Tuya API');
      this.platform.log.info(`[DEBUG] Dispositivo encontrado: ${JSON.stringify(response.result, null, 2)}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.platform.log.error(`[DEBUG] ✗ Error al conectar con Tuya API: ${errorMsg}`);

      if (error instanceof TuyaAPIError) {
        this.platform.log.error(`[DEBUG]   Error code: ${error.code}`);
        this.platform.log.error('[DEBUG]   Posibles soluciones:');
        this.platform.log.error('  - Verifica que las credenciales sean correctas');
        this.platform.log.error('  - Comprueba que el Device ID es válido');
        this.platform.log.error('  - Verifica que el endpoint es correcto para tu región');
      }
    }
  }

  /**
   * Maneja la petición SET del estado del switch
   */
  async setOn(value: CharacteristicValue) {
    const isOn = value as boolean;
    const timestamp = new Date().toISOString();

    try {
      this.platform.log.info(`[${timestamp}] Setting vacuum to: ${isOn ? 'ON (cleaning)' : 'OFF (stop)'}`);

      const commands = [
        { code: 'power', value: true },
        { code: 'power_go', value: true },
        { code: 'mode', value: isOn ? 'smart' : 'chargego' },
        { code: 'suction', value: 'normal' },
      ];

      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info('[DEBUG] Enviando comando a Tuya API');
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info(`[DEBUG] Timestamp: ${timestamp}`);
        this.platform.log.info(`[DEBUG] Endpoint: ${this.platform.config.endpoint}`);
        this.platform.log.info(`[DEBUG] Device ID: ${this.platform.config.deviceId}`);
        this.platform.log.info(`[DEBUG] Path: /v1.0/devices/${this.platform.config.deviceId}/commands`);
        this.platform.log.info(`[DEBUG] Method: POST`);
        this.platform.log.info('[DEBUG] Body:', JSON.stringify({ commands }, null, 2));
        this.platform.log.info('[DEBUG] ========================================');
      }

      // Enviar comando a Tuya con reintentos
      const response = await withRetry(
        async () => {
          const result = await this.tuya.request({
            path: `/v1.0/devices/${this.platform.config.deviceId}/commands`,
            method: 'POST',
            body: { commands },
          });
          validateTuyaResponse(result);
          return result;
        },
        {
          maxRetries: 3,
          initialDelayMs: 500,
          timeoutMs: 15000,
        },
        this.platform.log,
      );

      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info('[DEBUG] Respuesta de Tuya API');
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info('[DEBUG]', JSON.stringify(response, null, 2));
        this.platform.log.info('[DEBUG] ========================================');
      }

      this.platform.log.info(`✓ Command sent successfully! Vacuum should ${isOn ? 'start cleaning' : 'stop'}`);
    } catch (error) {
      this.platform.log.error(`✗ Failed to send command: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof TuyaAPIError) {
        this.platform.log.error(`  Error code: ${error.code}`);
      }

      if (this.platform.config.debug && error instanceof Error) {
        this.platform.log.error('[DEBUG] Stack trace:', error.stack);
      }

      throw error;
    }
  }

  /**
   * Maneja la petición GET del estado del switch
   */
  async getOn(): Promise<CharacteristicValue> {
    try {
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] Consultando estado del dispositivo...');
        this.platform.log.info(`[DEBUG] Path: /v1.0/devices/${this.platform.config.deviceId}/status`);
        this.platform.log.info('[DEBUG] Method: GET');
      }

      const response = await withRetry(
        async () => {
          const result = await this.tuya.request({
            path: `/v1.0/devices/${this.platform.config.deviceId}/status`,
            method: 'GET',
          });
          validateTuyaResponse(result);
          return result;
        },
        {
          maxRetries: 2,
          initialDelayMs: 300,
          timeoutMs: 10000,
        },
        this.platform.log,
      );

      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] Respuesta de estado:', JSON.stringify(response, null, 2));
      }

      if (response.result && Array.isArray(response.result)) {
        const modeStatus = (response.result as TuyaDeviceStatus[]).find((status) => status.code === 'mode');
        const isOn = modeStatus ? modeStatus.value === 'smart' || modeStatus.value === 'zone' : false;

        this.platform.log.debug(`Current vacuum state: ${isOn ? 'ON (cleaning)' : 'OFF (charging/idle)'}`);

        if (this.platform.config.debug) {
          this.platform.log.info(`[DEBUG] Estado de 'mode': ${modeStatus?.value ?? 'no encontrado'}`);
          this.platform.log.info(`[DEBUG] Interpretado como: ${isOn ? 'ON' : 'OFF'}`);
        }

        return isOn;
      } else {
        this.platform.log.warn('Invalid device status response: result is not an array');
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.platform.log.error(`Failed to get device status: ${errorMsg}`);

      if (error instanceof TuyaAPIError) {
        this.platform.log.error(`  Error code: ${error.code}`);
      }

      if (this.platform.config.debug && error instanceof Error) {
        this.platform.log.debug('[DEBUG] Stack trace:', error.stack);
      }

      return false;
    }
  }
}
