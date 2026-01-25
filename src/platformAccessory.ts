import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { OsojiVacuumPlatform } from './platform';
import { TuyaContext } from '@tuya/tuya-connector-nodejs';
import { TuyaDeviceStatus } from './types';

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

      const response = await this.tuya.request({
        path: `/v1.0/devices/${this.platform.config.deviceId}`,
        method: 'GET',
      });

      if (response.success) {
        this.platform.log.info('[DEBUG] ✓ Conexión exitosa con Tuya API');
        this.platform.log.info(`[DEBUG] Dispositivo encontrado: ${JSON.stringify(response.result, null, 2)}`);
      } else {
        this.platform.log.warn('[DEBUG] ✗ Fallo en conexión con Tuya API');
        this.platform.log.warn(`[DEBUG] Respuesta: ${JSON.stringify(response, null, 2)}`);
      }
    } catch (error) {
      this.platform.log.error('[DEBUG] ✗ Error al probar conexión:', error);
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

      // Debug: Log de la petición que se enviará
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info('[DEBUG] Enviando comando a Tuya API');
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info(`[DEBUG] Timestamp: ${timestamp}`);
        this.platform.log.info(`[DEBUG] Endpoint: ${this.platform.config.endpoint}`);
        this.platform.log.info(`[DEBUG] Device ID: ${this.platform.config.deviceId}`);
        this.platform.log.info(`[DEBUG] Path: /v1.0/devices/${this.platform.config.deviceId}/commands`);
        this.platform.log.info(`[DEBUG] Method: POST`);
        this.platform.log.info('[DEBUG] Body:');
        this.platform.log.info(JSON.stringify({
          commands: [{ code: 'power', value: isOn }],
        }, null, 2));
        this.platform.log.info('[DEBUG] ========================================');
      }

      // Enviar comando a Tuya
      const response = await this.tuya.request({
        path: `/v1.0/devices/${this.platform.config.deviceId}/commands`,
        method: 'POST',
        body: {
          commands: [
            {
              code: 'power',
              value: isOn,
            },
          ],
        },
      });

      // Debug: Log de la respuesta completa
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info('[DEBUG] Respuesta de Tuya API');
        this.platform.log.info('[DEBUG] ========================================');
        this.platform.log.info(JSON.stringify(response, null, 2));
        this.platform.log.info('[DEBUG] ========================================');
      }

      if (response.success) {
        this.platform.log.info(`✓ Command sent successfully! Vacuum should ${isOn ? 'start cleaning' : 'stop'}`);
        this.platform.log.debug('Full response:', JSON.stringify(response));
      } else {
        this.platform.log.error('✗ Failed to send command');
        this.platform.log.error(`Error message: ${response.msg || 'Unknown error'}`);
        this.platform.log.error(`Error code: ${response.code || 'N/A'}`);
        if (this.platform.config.debug) {
          this.platform.log.error('[DEBUG] Error completo:', JSON.stringify(response, null, 2));
        }
        throw new Error(response.msg || 'Failed to send command');
      }
    } catch (error) {
      this.platform.log.error('✗ Exception occurred while sending command to Tuya');
      this.platform.log.error(`Error: ${error}`);
      if (this.platform.config.debug && error instanceof Error) {
        this.platform.log.error('[DEBUG] Stack trace:');
        this.platform.log.error(error.stack || 'No stack trace available');
      }
      throw error;
    }
  }

  /**
   * Maneja la petición GET del estado del switch
   */
  async getOn(): Promise<CharacteristicValue> {
    try {
      // Debug: Log de la petición que se enviará
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] Consultando estado del dispositivo...');
        this.platform.log.info(`[DEBUG] Path: /v1.0/devices/${this.platform.config.deviceId}/status`);
        this.platform.log.info('[DEBUG] Method: GET');
      }

      // Obtener el estado actual del dispositivo
      const response = await this.tuya.request({
        path: `/v1.0/devices/${this.platform.config.deviceId}/status`,
        method: 'GET',
      });

      // Debug: Log de la respuesta completa
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] Respuesta de estado:');
        this.platform.log.info(`[DEBUG] ${JSON.stringify(response, null, 2)}`);
      }

      if (response.success && response.result) {
        // Buscar el estado del código 'power'
        const powerStatus = (response.result as TuyaDeviceStatus[]).find((status) => status.code === 'power');
        const isOn = powerStatus ? powerStatus.value : false;

        this.platform.log.debug('Current vacuum state:', isOn ? 'ON' : 'OFF');

        if (this.platform.config.debug) {
          this.platform.log.info(`[DEBUG] Estado de 'power' encontrado: ${isOn}`);
          this.platform.log.info(`[DEBUG] Todos los estados: ${JSON.stringify(response.result, null, 2)}`);
        }

        return isOn;
      } else {
        this.platform.log.error('Failed to get device status:', response.msg || 'Unknown error');
        if (this.platform.config.debug) {
          this.platform.log.error('[DEBUG] Error completo:', JSON.stringify(response, null, 2));
        }
        return false;
      }
    } catch (error) {
      this.platform.log.error('Error getting device status from Tuya:', error);
      if (this.platform.config.debug) {
        this.platform.log.error('[DEBUG] Stack trace:', error);
      }
      return false;
    }
  }
}
