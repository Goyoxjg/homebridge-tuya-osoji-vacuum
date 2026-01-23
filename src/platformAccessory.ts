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
    // Inicializar cliente Tuya
    this.tuya = new TuyaContext({
      baseUrl: this.platform.config.endpoint,
      accessKey: this.platform.config.accessKey,
      secretKey: this.platform.config.secretKey,
    });

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
  }

  /**
   * Maneja la petición SET del estado del switch
   */
  async setOn(value: CharacteristicValue) {
    const isOn = value as boolean;

    try {
      this.platform.log.info(`Setting vacuum to: ${isOn ? 'ON (cleaning)' : 'OFF (stop)'}`);

      // Debug: Log de la petición que se enviará
      if (this.platform.config.debug) {
        this.platform.log.info('[DEBUG] Enviando petición a Tuya API:');
        this.platform.log.info(`[DEBUG] Path: /v1.0/devices/${this.platform.config.deviceId}/commands`);
        this.platform.log.info(`[DEBUG] Method: POST`);
        this.platform.log.info(`[DEBUG] Body: ${JSON.stringify({
          commands: [{ code: 'power', value: isOn }],
        }, null, 2)}`);
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
        this.platform.log.info('[DEBUG] Respuesta de Tuya API:');
        this.platform.log.info(`[DEBUG] ${JSON.stringify(response, null, 2)}`);
      }

      if (response.success) {
        this.platform.log.debug('Command sent successfully:', JSON.stringify(response));
      } else {
        this.platform.log.error('Failed to send command:', response.msg || 'Unknown error');
        if (this.platform.config.debug) {
          this.platform.log.error('[DEBUG] Error completo:', JSON.stringify(response, null, 2));
        }
        throw new Error(response.msg || 'Failed to send command');
      }
    } catch (error) {
      this.platform.log.error('Error sending command to Tuya:', error);
      if (this.platform.config.debug) {
        this.platform.log.error('[DEBUG] Stack trace:', error);
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
