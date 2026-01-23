import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { OsojiVacuumAccessory } from './platformAccessory';
import { OsojiVacuumPlatformConfig } from './config';

export class OsojiVacuumPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];
  public readonly config: OsojiVacuumPlatformConfig;

  constructor(
    public readonly log: Logger,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = config as unknown as OsojiVacuumPlatformConfig;

    this.log.debug('Finished initializing platform:', this.config.name);

    // Validar configuración
    if (!this.config.accessId || !this.config.accessSecret || !this.config.deviceId || !this.config.endpoint) {
      this.log.error('Missing required configuration. Please check your config.json');
      return;
    }

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    const uuid = this.api.hap.uuid.generate('osoji-vacuum-' + this.config.deviceId);

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      new OsojiVacuumAccessory(this, existingAccessory);
    } else {
      this.log.info('Adding new accessory: OSOJI');
      const accessory = new this.api.platformAccessory('OSOJI', uuid);

      accessory.context.device = {
        deviceId: this.config.deviceId,
        displayName: 'OSOJI',
      };

      new OsojiVacuumAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
