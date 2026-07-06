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

    this.validateConfiguration();

    if (this.config.debug) {
      this.log.info('[DEBUG] Debug mode enabled - detailed logs will be shown');
      this.log.info(`[DEBUG] Endpoint: ${this.config.endpoint}`);
      this.log.info(`[DEBUG] Device ID: ${this.config.deviceId}`);
    }

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * Valida la configuración del plugin
   */
  private validateConfiguration(): void {
    const missingFields: string[] = [];
    const invalidFields: Array<{ field: string; reason: string }> = [];

    // Campos requeridos
    if (!this.config.accessKey) {
      missingFields.push('accessKey');
    } else if (this.config.accessKey.length < 10) {
      invalidFields.push({ field: 'accessKey', reason: 'demasiado corta (mín. 10 caracteres)' });
    }

    if (!this.config.secretKey) {
      missingFields.push('secretKey');
    } else if (this.config.secretKey.length < 10) {
      invalidFields.push({ field: 'secretKey', reason: 'demasiado corta (mín. 10 caracteres)' });
    }

    if (!this.config.deviceId) {
      missingFields.push('deviceId');
    } else if (this.config.deviceId.length < 10) {
      invalidFields.push({ field: 'deviceId', reason: 'demasiado corta (mín. 10 caracteres)' });
    }

    if (!this.config.endpoint) {
      missingFields.push('endpoint');
    } else if (!this.isValidEndpoint(this.config.endpoint)) {
      invalidFields.push({ field: 'endpoint', reason: 'endpoint no válido' });
    }

    // Reportar errores
    if (missingFields.length > 0) {
      this.log.error(`❌ Faltan campos requeridos: ${missingFields.join(', ')}`);
      this.log.error('Por favor verifica tu configuración en Homebridge UI');
      return;
    }

    if (invalidFields.length > 0) {
      this.log.error('❌ Campos con valores inválidos:');
      invalidFields.forEach(({ field, reason }) => {
        this.log.error(`  - ${field}: ${reason}`);
      });
      return;
    }

    this.log.info('✓ Configuración validada correctamente');
  }

  /**
   * Valida que el endpoint sea uno de los soportados
   */
  private isValidEndpoint(endpoint: string): boolean {
    const validEndpoints = [
      'https://openapi.tuyaus.com',
      'https://openapi.tuyaeu.com',
      'https://openapi.tuyacn.com',
      'https://openapi.tuyain.com',
    ];
    return validEndpoints.includes(endpoint);
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
