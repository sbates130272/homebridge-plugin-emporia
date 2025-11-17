
const axios = require('axios');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-emporia-smartplug', 'EmporiaSmartPlug', EmporiaSmartPlug);
}

class EmporiaSmartPlug {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.deviceId = config.deviceId;
    this.state = false;
  }

  async getPowerState() {
    try {
      // Example API call (replace with real API endpoint)
      const response = await axios.get(`https://api.emporiaenergy.com/devices/${this.deviceId}?apikey=${this.apiKey}`);
      this.state = response.data.state === 'on';
    } catch (error) {
      this.log('Error getting power state:', error);
    }
    return this.state;
  }

  async setPowerState(powerOn) {
    try {
      await axios.post(`https://api.emporiaenergy.com/devices/${this.deviceId}/switch?apikey=${this.apiKey}`, { state: powerOn ? 'on' : 'off' });
      this.state = powerOn;
    } catch (error) {
      this.log('Error setting power state:', error);
    }
  }

  getServices() {
    const informationService = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'Emporia')
      .setCharacteristic(Characteristic.Model, 'Smart Plug')
      .setCharacteristic(Characteristic.SerialNumber, this.deviceId);

    const outletService = new Service.Outlet(this.name);
    outletService.getCharacteristic(Characteristic.On)
      .on('get', async (callback) => callback(null, await this.getPowerState()))
      .on('set', async (value, callback) => {
        await this.setPowerState(value);
        callback(null);
      });

    return [informationService, outletService];
  }
}
