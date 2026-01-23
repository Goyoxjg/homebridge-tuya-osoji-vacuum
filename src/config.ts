export interface OsojiVacuumPlatformConfig {
  name: string;
  accessKey: string;  // Cambiado de accessId (API v2.x)
  secretKey: string;  // Cambiado de accessSecret (API v2.x)
  deviceId: string;
  endpoint: string;
  debug?: boolean;  // Flag opcional para habilitar logs detallados
}
