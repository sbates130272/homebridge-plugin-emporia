
# Homebridge Emporia Smart Plug

This is a Homebridge plugin for controlling Emporia smart plugs.

## Installation

```bash
npm install -g homebridge-emporia-smartplug
```

## Configuration

Add this to your Homebridge `config.json`:

```json
{
  "accessories": [
    {
      "accessory": "EmporiaSmartPlug",
      "name": "Living Room Plug",
      "apiKey": "YOUR_API_KEY",
      "deviceId": "YOUR_DEVICE_ID"
    }
  ]
}
```
