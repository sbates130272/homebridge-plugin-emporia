import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import type { EmporiaEnergyPlatform } from './platform.js';
import type { EmporiaOutlet } from './emporiaApi.js';

/**
 * Emporia Outlet Accessory
 * Handles an Emporia smart outlet/plug
 */
export class EmporiaOutletAccessory {
  private outletService: Service;
  private currentState = false;
  private lastUpdate = 0;
  private updateInProgress = false;

  // Energy monitoring
  private currentPower = 0; // Watts
  private totalConsumption = 0; // kWh

  constructor(
    private readonly platform: EmporiaEnergyPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device as EmporiaOutlet;

    // Set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Emporia Energy',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'Smart Outlet')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        device.deviceGid.toString(),
      );

    // Get or create the Outlet service
    this.outletService =
      this.accessory.getService(this.platform.Service.Outlet) ||
      this.accessory.addService(this.platform.Service.Outlet);

    // Set the service name
    this.outletService.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.displayName,
    );

    // Register handlers for On/Off characteristic
    this.outletService
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    // Register handler for OutletInUse characteristic
    this.outletService
      .getCharacteristic(this.platform.Characteristic.OutletInUse)
      .onGet(this.getOutletInUse.bind(this));

    // Add energy monitoring if enabled
    if (this.platform.config.exposeEnergyMonitoring !== false) {
      // Note: HomeKit doesn't have native power consumption characteristics
      // These would require Eve HomeKit types or custom characteristics
      // For now we'll log the values and they can be added via 
      // homebridge-lib later
      this.platform.log.debug(
        'Energy monitoring enabled for outlet:',
        accessory.displayName,
      );
    }

    // Initialize current state
    this.currentState = device.outletOn || false;

    // Set up periodic status updates
    this.startStatusPolling();
  }

  /**
   * Start polling for device status
   */
  private startStatusPolling(): void {
    const interval = (this.platform.config.updateInterval || 60) * 1000;

    setInterval(async () => {
      await this.updateStatus();
    }, interval);

    // Do an immediate update
    this.updateStatus();
  }

  /**
   * Update device status from API
   */
  private async updateStatus(): Promise<void> {
    if (this.updateInProgress) {
      return;
    }

    this.updateInProgress = true;

    try {
      const device = this.accessory.context.device as EmporiaOutlet;
      const outlets = await this.platform.getApi().getOutlets();
      const outlet = outlets.find((o) => o.deviceGid === device.deviceGid);

      if (outlet) {
        this.currentState = outlet.outletOn;
        this.accessory.context.device = outlet;

        // Update HomeKit
        this.outletService.updateCharacteristic(
          this.platform.Characteristic.On,
          this.currentState,
        );

        // Update energy data if monitoring is enabled
        // Note: Energy monitoring is only available for Vue energy monitor devices,
        // not for smart outlets
        if (this.platform.config.exposeEnergyMonitoring === true) {
          try {
            const usage = await this.platform
              .getApi()
              .getDeviceUsage(device.deviceGid);

            if (usage.channelUsages && usage.channelUsages.length > 0) {
              // Usage is in kWh for the time period
              // Convert to instantaneous power (watts)
              const usageKwh = usage.channelUsages[0].usage || 0;
              // Assuming 1 minute intervals, multiply by 60 to get hourly rate
              this.currentPower = usageKwh * 60 * 1000; // Convert to watts
              this.totalConsumption += usageKwh;

              if (this.platform.config.debug) {
                this.platform.log.debug(
                  `${this.accessory.displayName} - Power: 
                    ${this.currentPower.toFixed(1)}W, 
                    Total: ${this.totalConsumption.toFixed(3)}kWh`,
                );
              }
            }
          } catch (error) {
            // Energy data may not be available for all devices
            if (this.platform.config.debug) {
              this.platform.log.debug(
                `Could not fetch energy data for ${this.accessory.displayName}`,
              );
            }
          }
        }

        this.lastUpdate = Date.now();
      }
    } catch (error) {
      this.platform.log.error(
        `Failed to update status for ${this.accessory.displayName}:`,
        error,
      );
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Handle SET requests for the On characteristic
   */
  async setOn(value: CharacteristicValue): Promise<void> {
    const newState = value as boolean;

    try {
      const device = this.accessory.context.device as EmporiaOutlet;
      await this.platform.getApi().updateOutlet(device.deviceGid, newState);

      this.currentState = newState;
      this.platform.log.info(
        `${this.accessory.displayName} turned ${newState ? 'ON' : 'OFF'}`,
      );

      // Update status after a short delay to confirm
      setTimeout(() => {
        this.updateStatus();
      }, 1000);
    } catch (error) {
      this.platform.log.error(
        `Failed to set outlet state for ${this.accessory.displayName}:`,
        error,
      );
      throw new this.platform.homebridgeApi.hap.HapStatusError(
        this.platform.homebridgeApi.hap.HAPStatus
          .SERVICE_COMMUNICATION_FAILURE,
      );
    }
  }

  /**
   * Handle GET requests for the On characteristic
   */
  async getOn(): Promise<CharacteristicValue> {
    // Return cached state, updates happen via polling
    return this.currentState;
  }

  /**
   * Handle GET requests for the OutletInUse characteristic
   */
  async getOutletInUse(): Promise<CharacteristicValue> {
    // Return true if outlet is on and drawing power
    return this.currentState && this.currentPower > 0;
  }
}

