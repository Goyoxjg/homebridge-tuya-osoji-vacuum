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
      accessKey: this.platform.config.accessId,
      secretKey: this.platform.config.accessSecret,
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

      if (response.success) {
        this.platform.log.debug('Command sent successfully:', JSON.stringify(response));
      } else {
        this.platform.log.error('Failed to send command:', response.msg || 'Unknown error');
        throw new Error(response.msg || 'Failed to send command');
      }
    } catch (error) {
      this.platform.log.error('Error sending command to Tuya:', error);
      throw error;
    }
  }

  /**
   * Maneja la petición GET del estado del switch
   */
  async getOn(): Promise<CharacteristicValue> {
    try {
      // Obtener el estado actual del dispositivo
      const response = await this.tuya.request({
        path: `/v1.0/devices/${this.platform.config.deviceId}/status`,
        method: 'GET',
      });

      if (response.success && response.result) {
        // Buscar el estado del código 'power'
        const powerStatus = (response.result as TuyaDeviceStatus[]).find((status) => status.code === 'power');
        const isOn = powerStatus ? powerStatus.value : false;

        this.platform.log.debug('Current vacuum state:', isOn ? 'ON' : 'OFF');
        return isOn;
      } else {
        this.platform.log.error('Failed to get device status:', response.msg || 'Unknown error');
        return false;
      }
    } catch (error) {
      this.platform.log.error('Error getting device status from Tuya:', error);
      return false;
    }
  }
}
