import { API } from 'homebridge';
import { OsojiVacuumPlatform } from './platform';
import { PLATFORM_NAME } from './settings';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, OsojiVacuumPlatform);
};
