import type { API } from 'homebridge';

import { EmporiaEnergyPlatform } from './platform.js';
import { PLATFORM_NAME } from './settings.js';

/**
 * This method registers the Emporia Energy platform with Homebridge
 */
export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, EmporiaEnergyPlatform);
};
