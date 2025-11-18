import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';

import type { EmporiaEnergyPlatform } from './platform.js';
import type { EmporiaCharger } from './emporiaApi.js';

/**
 * Emporia EV Charger Accessory
 * Handles an Emporia EV charger (EVSE)
 * Exposed as a Switch in HomeKit (since there's no native EVSE type)
 */
export class EmporiaChargerAccessory {
  private switchService: Service;
  private currentState = false;
  private currentChargingRate = 0; // Amps
  private maxChargingRate = 0; // Amps
  private lastUpdate = 0;
  private updateInProgress = false;

  // Energy monitoring
  private currentPower = 0; // Watts
  private totalConsumption = 0; // kWh

  constructor(
    private readonly platform: EmporiaEnergyPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    const device = accessory.context.device as EmporiaCharger;

    // Set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Emporia Energy',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'EV Charger')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        device.deviceGid.toString(),
      );

    // Get or create the Switch service (representing the charger on/off)
    this.switchService =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // Set the service name
    this.switchService.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.displayName,
    );

    // Register handlers for On/Off characteristic
    this.switchService
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    // Initialize current state and charging rates
    this.currentState = device.chargerOn || false;
    this.currentChargingRate = device.chargingRate || 0;
    this.maxChargingRate = device.maxChargingRate || 32;

    this.platform.log.info(
      `${accessory.displayName} - Max charging rate: 
        ${this.maxChargingRate}A`,
    );

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
      const device = this.accessory.context.device as EmporiaCharger;
      const chargers = await this.platform.getApi().getChargers();
      const charger = chargers.find((c) => c.deviceGid === device.deviceGid);

      if (charger) {
        this.currentState = charger.chargerOn;
        this.currentChargingRate = charger.chargingRate || 0;
        this.maxChargingRate = charger.maxChargingRate || 32;
        this.accessory.context.device = charger;

        // Update HomeKit
        this.switchService.updateCharacteristic(
          this.platform.Characteristic.On,
          this.currentState,
        );

        // Update energy data if monitoring is enabled
        // Note: Energy monitoring may not be available for all charger types
        if (this.platform.config.exposeEnergyMonitoring === true) {
          try {
            const usage = await this.platform
              .getApi()
              .getDeviceUsage(device.deviceGid);

            if (usage.channelUsages && usage.channelUsages.length > 0) {
              // Usage is in kWh for the time period
              const usageKwh = usage.channelUsages[0].usage || 0;
              // Convert to instantaneous power (watts)
              // Assuming 1 minute intervals
              this.currentPower = usageKwh * 60 * 1000;
              this.totalConsumption += usageKwh;

              if (this.platform.config.debug) {
                this.platform.log.debug(
                  `${this.accessory.displayName} - Power: 
                    ${this.currentPower.toFixed(1)}W, 
                    Rate: ${this.currentChargingRate}A, 
                    Total: ${this.totalConsumption.toFixed(3)}kWh`,
                );
              }
            }
          } catch (error) {
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
      const device = this.accessory.context.device as EmporiaCharger;

      // When turning on, use the current/max charging rate
      // When turning off, rate doesn't matter
      const chargingRate = newState ? this.currentChargingRate : 0;

      await this.platform
        .getApi()
        .updateCharger(
          device.deviceGid,
          newState,
          chargingRate,
          this.maxChargingRate,
        );

      this.currentState = newState;
      this.platform.log.info(
        `${this.accessory.displayName} turned 
          ${newState ? 'ON' : 'OFF'}`,
      );

      // Update status after a short delay to confirm
      setTimeout(() => {
        this.updateStatus();
      }, 1000);
    } catch (error) {
      this.platform.log.error(
        `Failed to set charger state for ${this.accessory.displayName}:`,
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
   * Get current charging rate (for potential future use)
   */
  getCurrentChargingRate(): number {
    return this.currentChargingRate;
  }

  /**
   * Get max charging rate (for potential future use)
   */
  getMaxChargingRate(): number {
    return this.maxChargingRate;
  }

  /**
   * Get current power consumption (for potential future use)
   */
  getCurrentPower(): number {
    return this.currentPower;
  }
}

