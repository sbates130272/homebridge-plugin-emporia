import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { EmporiaOutletAccessory } from './outletAccessory.js';
import { EmporiaChargerAccessory } from './chargerAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { EmporiaApi, EmporiaTokens } from './emporiaApi.js';
import * as fs from 'fs';
import * as path from 'path';

export interface DeviceConfig {
  deviceGid: number;
  name?: string;
  hide?: boolean;
}

export interface EmporiaPlatformConfig extends PlatformConfig {
  username: string;
  password: string;
  updateInterval?: number;
  exposeOutlets?: boolean;
  exposeChargers?: boolean;
  exposeEnergyMonitoring?: boolean;
  debug?: boolean;
  devices?: DeviceConfig[];
}

/**
 * Emporia Energy Platform Plugin
 * Discovers and manages Emporia Vue devices including outlets and 
 * EV chargers
 */
export class EmporiaEnergyPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // Track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly discoveredUUIDs: Set<string> = new Set();

  // Emporia API client
  private readonly api: EmporiaApi;
  private updateInterval?: NodeJS.Timeout;
  private readonly tokensFile: string;

  constructor(
    public readonly log: Logging,
    public readonly config: EmporiaPlatformConfig,
    public readonly homebridgeApi: API,
  ) {
    this.Service = homebridgeApi.hap.Service;
    this.Characteristic = homebridgeApi.hap.Characteristic;

    // Initialize Emporia API client
    this.api = new EmporiaApi(log);

    // Path for storing tokens
    this.tokensFile = path.join(
      homebridgeApi.user.storagePath(),
      'emporia-tokens.json',
    );

    // Validate configuration
    if (!config.username || !config.password) {
      this.log.error(
        'Username and password are required in the plugin configuration',
      );
      return;
    }

    this.log.info('Emporia Energy Platform initialized');

    // Wait for Homebridge to finish launching before discovering devices
    this.homebridgeApi.on('didFinishLaunching', () => {
      log.info('Homebridge finished launching, discovering devices...');
      this.authenticateAndDiscoverDevices();

      // Set up periodic update interval
      const interval = (config.updateInterval || 60) * 1000;
      this.updateInterval = setInterval(() => {
        this.updateAllDevices();
      }, interval);
    });

    // Cleanup on shutdown
    this.homebridgeApi.on('shutdown', () => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
    });
  }

  /**
   * Restore cached accessories from disk
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading cached accessory:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * Authenticate and discover devices
   */
  private async authenticateAndDiscoverDevices(): Promise<void> {
    try {
      // Try to load saved tokens
      let authenticated = false;
      if (fs.existsSync(this.tokensFile)) {
        try {
          const tokensData = fs.readFileSync(this.tokensFile, 'utf-8');
          const tokens: EmporiaTokens = JSON.parse(tokensData);
          if (tokens.expiresAt > Date.now()) {
            this.api.setTokens(tokens, this.config.username);
            authenticated = true;
            this.log.info('Loaded saved authentication tokens');
          }
        } catch (error) {
          this.log.warn('Failed to load saved tokens:', error);
        }
      }

      // Authenticate if needed
      if (!authenticated) {
        this.log.info('Authenticating with Emporia API...');
        const tokens = await this.api.login(
          this.config.username,
          this.config.password,
        );
        // Save tokens
        fs.writeFileSync(this.tokensFile, JSON.stringify(tokens, null, 2));
      }

      // Discover devices
      await this.discoverDevices();
    } catch (error) {
      this.log.error('Failed to authenticate or discover devices:', error);
      // Retry after 60 seconds
      setTimeout(() => {
        this.authenticateAndDiscoverDevices();
      }, 60000);
    }
  }

  /**
   * Discover and register devices
   */
  private async discoverDevices(): Promise<void> {
    try {
      const exposeOutlets = this.config.exposeOutlets !== false;
      const exposeChargers = this.config.exposeChargers !== false;

      // Get outlets if enabled
      if (exposeOutlets) {
        const outlets = await this.api.getOutlets();
        this.log.info(`Discovered ${outlets.length} outlet(s)`);

        for (const outlet of outlets) {
          // Check if device should be hidden
          if (this.isDeviceHidden(outlet.deviceGid)) {
            this.log.info(
              `Skipping hidden outlet: ${outlet.deviceGid}`,
            );
            continue;
          }

          const uuid = this.homebridgeApi.hap.uuid.generate(
            `outlet-${outlet.deviceGid}`,
          );
          this.discoveredUUIDs.add(uuid);

          // Get custom or default name
          const defaultName = outlet.locationProperties?.deviceName ||
            `Emporia Outlet ${outlet.deviceGid}`;
          const name = this.getDeviceName(outlet.deviceGid, defaultName);

          const existingAccessory = this.accessories.get(uuid);

          if (existingAccessory) {
            this.log.info(
              'Restoring outlet from cache:',
              existingAccessory.displayName,
            );
            // Update name if it changed
            if (existingAccessory.displayName !== name) {
              this.log.info(`Updating outlet name to: ${name}`);
              existingAccessory.displayName = name;
              existingAccessory._associatedHAPAccessory.displayName = name;
            }
            existingAccessory.context.device = outlet;
            this.homebridgeApi.updatePlatformAccessories([existingAccessory]);
            new EmporiaOutletAccessory(this, existingAccessory);
          } else {
            this.log.info('Adding new outlet:', name);

            const accessory = new this.homebridgeApi.platformAccessory(
              name,
              uuid,
            );
            accessory.context.device = outlet;

            new EmporiaOutletAccessory(this, accessory);
            this.homebridgeApi.registerPlatformAccessories(
              PLUGIN_NAME,
              PLATFORM_NAME,
              [accessory],
            );
            this.accessories.set(uuid, accessory);
          }
        }
      }

      // Get EV chargers if enabled
      if (exposeChargers) {
        const chargers = await this.api.getChargers();
        this.log.info(`Discovered ${chargers.length} EV charger(s)`);

        for (const charger of chargers) {
          // Check if device should be hidden
          if (this.isDeviceHidden(charger.deviceGid)) {
            this.log.info(
              `Skipping hidden charger: ${charger.deviceGid}`,
            );
            continue;
          }

          const uuid = this.homebridgeApi.hap.uuid.generate(
            `charger-${charger.deviceGid}`,
          );
          this.discoveredUUIDs.add(uuid);

          // Get custom or default name
          const defaultName = `Emporia Charger ${charger.deviceGid}`;
          const name = this.getDeviceName(charger.deviceGid, defaultName);

          const existingAccessory = this.accessories.get(uuid);

          if (existingAccessory) {
            this.log.info(
              'Restoring charger from cache:',
              existingAccessory.displayName,
            );
            // Update name if it changed
            if (existingAccessory.displayName !== name) {
              this.log.info(`Updating charger name to: ${name}`);
              existingAccessory.displayName = name;
              existingAccessory._associatedHAPAccessory.displayName = name;
            }
            existingAccessory.context.device = charger;
            this.homebridgeApi.updatePlatformAccessories([existingAccessory]);
            new EmporiaChargerAccessory(this, existingAccessory);
          } else {
            this.log.info('Adding new EV charger:', name);

            const accessory = new this.homebridgeApi.platformAccessory(
              name,
              uuid,
            );
            accessory.context.device = charger;

            new EmporiaChargerAccessory(this, accessory);
            this.homebridgeApi.registerPlatformAccessories(
              PLUGIN_NAME,
              PLATFORM_NAME,
              [accessory],
            );
            this.accessories.set(uuid, accessory);
          }
        }
      }

      // Remove accessories no longer present
      for (const [uuid, accessory] of this.accessories) {
        if (!this.discoveredUUIDs.has(uuid)) {
          this.log.info(
            'Removing accessory no longer present:',
            accessory.displayName,
          );
          this.homebridgeApi.unregisterPlatformAccessories(
            PLUGIN_NAME,
            PLATFORM_NAME,
            [accessory],
          );
          this.accessories.delete(uuid);
        }
      }

      this.log.info('Device discovery complete');
    } catch (error) {
      this.log.error('Failed to discover devices:', error);
      throw error;
    }
  }

  /**
   * Update all devices with latest data
   */
  private async updateAllDevices(): Promise<void> {
    if (this.config.debug) {
      this.log.debug('Updating all devices...');
    }
    // Device accessories will handle their own updates via polling
  }

  /**
   * Get the Emporia API client
   */
  getApi(): EmporiaApi {
    return this.api;
  }

  /**
   * Get device configuration by device GID
   */
  private getDeviceConfig(deviceGid: number): DeviceConfig | undefined {
    return this.config.devices?.find((d) => d.deviceGid === deviceGid);
  }

  /**
   * Get custom name for device or fall back to default
   */
  private getDeviceName(
    deviceGid: number,
    defaultName: string,
  ): string {
    const deviceConfig = this.getDeviceConfig(deviceGid);
    return deviceConfig?.name || defaultName;
  }

  /**
   * Check if device should be hidden
   */
  private isDeviceHidden(deviceGid: number): boolean {
    const deviceConfig = this.getDeviceConfig(deviceGid);
    return deviceConfig?.hide === true;
  }
}
