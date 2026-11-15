export interface OsojiVacuumPlatformConfig {
  name: string;
  connectionMode?: 'local' | 'cloud' | 'auto';
  localIp?: string;
  localKey?: string;
  localVersion?: string;
  pythonPath?: string;
  accessKey?: string;  // Cambiado de accessId (API v2.x)
  secretKey?: string;  // Cambiado de accessSecret (API v2.x)
  deviceId: string;
  endpoint?: string;
  debug?: boolean;  // Flag opcional para habilitar logs detallados
}
