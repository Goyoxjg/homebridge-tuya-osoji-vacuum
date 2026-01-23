export interface TuyaDeviceStatus {
  code: string;
  value: any;
}

export interface TuyaResponse {
  success: boolean;
  result?: any;
  msg?: string;
}
