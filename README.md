
# Homebridge Emporia Energy Plugin

[![npm version](https://badge.fury.io/js/homebridge-plugin-emporia.svg)](https://badge.fury.io/js/homebridge-plugin-emporia)
[![CI](https://github.com/sbates130272/homebridge-plugin-emporia/actions/workflows/ci.yml/badge.svg)](https://github.com/sbates130272/homebridge-plugin-emporia/actions/workflows/ci.yml)

A [Homebridge](https://homebridge.io) plugin that integrates 
[Emporia Vue](https://emporiaenergy.com) energy monitoring devices with 
Apple HomeKit, including smart outlets and EV chargers.

This plugin is based on the [PyEmVue](https://github.com/magico13/PyEmVue) 
Python library and provides seamless integration of your Emporia devices 
into your HomeKit ecosystem.

## Features

- ✅ **Smart Outlet Control**: Turn Emporia smart outlets on/off via HomeKit
- ✅ **EV Charger Control**: Start/stop EV charging sessions
- ✅ **Energy Monitoring**: View real-time power consumption (optional)
- ✅ **Automatic Discovery**: Discovers all devices linked to your account
- ✅ **Persistent Authentication**: Tokens are cached to minimize API calls
- ✅ **HomeKit Native**: Appears as native outlets and switches in Home app

## Supported Devices

- Emporia Smart Outlets/Plugs
- Emporia EV Chargers (EVSE)
- Emporia Vue Energy Monitors (monitoring only, not as controllable 
  devices)

## Installation

### Via Homebridge UI (Recommended)

1. Search for "Emporia" in the Homebridge UI plugin search
2. Install "homebridge-plugin-emporia"
3. Configure with your Emporia account credentials
4. Restart Homebridge

### Via NPM

```bash
npm install -g homebridge-plugin-emporia
```

### Via Docker

See the [Docker Test Harness](#docker-test-harness) section below for 
running Homebridge with this plugin in Docker.

## Configuration

### Using Homebridge Config UI

The easiest way to configure this plugin is through the Homebridge Config 
UI:

1. Navigate to the Plugins tab
2. Find "Emporia Energy" and click Settings
3. Enter your Emporia account email and password
4. Configure optional settings
5. Save and restart Homebridge

### Manual Configuration

Add the following to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "your-email@example.com",
      "password": "your-password",
      "updateInterval": 60,
      "exposeOutlets": true,
      "exposeChargers": true,
      "exposeEnergyMonitoring": true,
      "debug": false
    }
  ]
}
```

### Configuration Options

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `platform` | Yes | - | Must be `EmporiaEnergy` |
| `name` | Yes | - | Platform name (e.g., "Emporia Energy") |
| `username` | Yes | - | Your Emporia account email |
| `password` | Yes | - | Your Emporia account password |
| `updateInterval` | No | `60` | Update interval in seconds (10-300) |
| `exposeOutlets` | No | `true` | Expose smart outlets to HomeKit |
| `exposeChargers` | No | `true` | Expose EV chargers to HomeKit |
| `exposeEnergyMonitoring` | No | `true` | Add energy consumption data |
| `debug` | No | `false` | Enable detailed debug logging |

### Device Customization

You can customize individual devices by adding a `devices` array to your
configuration. This allows you to:

- **Assign custom names** to make devices easier to identify and assign to
  rooms in HomeKit
- **Hide specific devices** that you don't want exposed to HomeKit

To customize a device, you need its **Device ID (GID)**, which is displayed
in Homebridge logs when devices are discovered:

```
[Emporia Energy] Discovered 3 outlet(s)
[Emporia Energy] Adding new outlet: Emporia Outlet 123456
```

In this example, the Device ID is `123456`.

#### Example: Custom Names and Hidden Devices

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "your-email@example.com",
      "password": "your-password",
      "devices": [
        {
          "deviceGid": 123456,
          "name": "Living Room Lamp"
        },
        {
          "deviceGid": 789012,
          "name": "Garage Freezer",
          "hide": false
        },
        {
          "deviceGid": 345678,
          "hide": true
        }
      ]
    }
  ]
}
```

In this example:
- Device `123456` will appear as "Living Room Lamp" (easier to assign to
  Living Room in Home app)
- Device `789012` will appear as "Garage Freezer"
- Device `345678` will be hidden and not appear in HomeKit at all

**Tips:**
- Use descriptive names that include the room for easier HomeKit organization
- Device names update automatically when you change the configuration
- Hidden devices can be un-hidden by setting `hide: false` or removing the
  device entry

## Usage

### Smart Outlets

Once configured, your Emporia smart outlets will appear as standard 
outlets in the Home app:

- **Turn On/Off**: Use the Home app, Siri, or automations
- **Status**: See current on/off state
- **Power Draw**: View current power consumption (if energy monitoring is 
  enabled)

**Siri Commands:**
- "Turn on the living room outlet"
- "Turn off the kitchen outlet"
- "Is the bedroom outlet on?"

### EV Chargers

EV chargers appear as switches in HomeKit:

- **Start/Stop Charging**: Toggle the switch to start/stop charging
- **Charging Status**: See if the charger is currently active
- **Power Monitoring**: View charging power consumption

**Siri Commands:**
- "Turn on the EV charger"
- "Stop charging the car"
- "Is the EV charger on?"

**Note**: Due to HomeKit limitations, EV chargers are exposed as switches 
rather than a dedicated EVSE accessory type. Charging rate control is not 
currently supported via HomeKit but may be added in future versions.

## Docker Test Harness

This plugin includes a comprehensive Docker-based test harness for local 
development and testing.

### Prerequisites

- Docker
- Docker Compose (or Docker Compose V2)

### Quick Start

1. Clone the repository:

```bash
git clone https://github.com/sbates130272/homebridge-plugin-emporia.git
cd homebridge-plugin-emporia
```

2. Update test configuration:

Edit `test/hbConfig/config.json` and add your Emporia credentials.

3. Start the test environment:

```bash
./docker-test.sh start
```

4. Access Homebridge UI:

Open http://localhost:8581 in your browser.

### Docker Commands

The `docker-test.sh` script provides several commands:

```bash
./docker-test.sh start      # Build and start Homebridge
./docker-test.sh stop       # Stop the container
./docker-test.sh restart    # Restart the container
./docker-test.sh logs       # View container logs
./docker-test.sh build      # Build the plugin
./docker-test.sh rebuild    # Rebuild everything
./docker-test.sh shell      # Open shell in container
./docker-test.sh clean      # Remove containers and volumes
```

### Development Environment

For active development with build tools:

```bash
./docker-test.sh dev        # Start dev container
./docker-test.sh dev-shell  # Open shell in dev container
```

## Development

### Building

```bash
npm install
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Watching for Changes

```bash
npm run watch
```

### Local Testing with Homebridge

1. Build the plugin:

```bash
npm run build
```

2. Link to your global Homebridge:

```bash
npm link
```

3. Add configuration to `~/.homebridge/config.json`

4. Start Homebridge in debug mode:

```bash
homebridge -D
```

## Troubleshooting

### Authentication Failed

**Problem**: Plugin fails to authenticate with Emporia API.

**Solutions**:
- Verify your email and password are correct
- Check if you can log into the Emporia mobile app
- Try deleting `emporia-tokens.json` from the Homebridge storage directory
- Ensure you're using your Emporia account credentials (not OAuth)

### Devices Not Appearing

**Problem**: Outlets or chargers don't show up in HomeKit.

**Solutions**:
- Enable `debug` mode in configuration
- Check Homebridge logs for errors
- Verify devices are visible in the Emporia mobile app
- Check `exposeOutlets` and `exposeChargers` settings
- Try removing the Homebridge bridge from HomeKit and re-adding it

### Slow Updates

**Problem**: Device states update slowly in HomeKit.

**Solutions**:
- Decrease `updateInterval` (minimum 10 seconds recommended)
- Check your network connection
- Verify the Emporia API is responding (check logs)

### API Rate Limiting

**Problem**: Getting rate limited by Emporia API.

**Solutions**:
- Increase `updateInterval` to 120 seconds or higher
- Disable `exposeEnergyMonitoring` if not needed
- Tokens are cached to minimize authentication calls

## API Documentation

This plugin uses the unofficial Emporia Energy API. For more details on 
the underlying API, see:

- [PyEmVue Documentation](https://github.com/magico13/PyEmVue)
- [PyEmVue API Docs](
  https://github.com/magico13/PyEmVue/blob/master/api_docs.md)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type safety
- 80-character line limit for readability

Run `npm run lint:fix` before committing.

## License

This project is licensed under the MIT License - see the 
[LICENSE](LICENSE) file for details.

## Disclaimer

This plugin is not affiliated with or endorsed by Emporia Energy. It is 
an independent integration created by the community.

Use at your own risk. The author is not responsible for any damage to 
your devices or data.

## Acknowledgments

- [PyEmVue](https://github.com/magico13/PyEmVue) - Python library that 
  provided the API implementation reference
- [Homebridge](https://homebridge.io) - The platform that makes this 
  integration possible
- Emporia Energy - For creating excellent energy monitoring hardware

## Support

- **Issues**: Report bugs or request features on 
  [GitHub Issues](https://github.com/sbates130272/homebridge-plugin-emporia/issues)
- **Discussions**: Ask questions on 
  [GitHub Discussions](https://github.com/sbates130272/homebridge-plugin-emporia/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.

## Roadmap

- [ ] Add charging rate control for EV chargers
- [ ] Support for scheduling via HomeKit automations
- [ ] Historical energy data tracking
- [ ] Support for Emporia Vue whole-home monitors as individual circuits
- [ ] Integration with Eve app for advanced energy statistics
- [ ] Support for custom HomeKit characteristics for more detailed data
