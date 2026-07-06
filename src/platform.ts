import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  Categories,
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

    this.log.info('Initializing OsojiVacuum platform...');
    this.log.debug('Finished initializing platform:', this.config.name);

    // Validar configuración
    const missingFields: string[] = [];
    if (!this.config.accessKey) {missingFields.push('accessKey');}
    if (!this.config.secretKey) {missingFields.push('secretKey');}
    if (!this.config.deviceId) {missingFields.push('deviceId');}
    if (!this.config.endpoint) {missingFields.push('endpoint');}

    if (missingFields.length > 0) {
      this.log.error(`Missing required configuration fields: ${missingFields.join(', ')}`);
      this.log.error('Please check your config.json and ensure all required fields are filled.');
      return;
    }

    this.log.info('Configuration validated successfully');
    if (this.config.debug) {
      this.log.info('[DEBUG] Debug mode enabled - detailed logs will be shown');
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
      const accessory = new this.api.platformAccessory('OSOJI', uuid, Categories.AIR_PURIFIER);

      accessory.context.device = {
        deviceId: this.config.deviceId,
        displayName: 'OSOJI',
      };

      new OsojiVacuumAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
