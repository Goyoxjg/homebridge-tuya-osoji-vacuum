export interface OsojiVacuumPlatformConfig {
  name: string;
  connectionMode?: 'local' | 'cloud' | 'auto';
  homekitPresentation?: 'switch' | 'fan';
  allowExperimentalModes?: boolean;
  localIp?: string;
  localKey?: string;
  localVersion?: string;
  allowLocalCommands?: boolean;
  pythonPath?: string;
  accessKey?: string;  // Cambiado de accessId (API v2.x)
  secretKey?: string;  // Cambiado de accessSecret (API v2.x)
  deviceId: string;
  endpoint?: string;
  debug?: boolean;  // Flag opcional para habilitar logs detallados
}
