# Getting Started with Development

Quick start guide for developers new to this plugin.

## Initial Setup

### 1. Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Docker (optional, for testing)
docker --version
docker-compose --version
```

If not installed:

```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/
install.sh | bash
nvm install 20
nvm use 20
```

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/yourusername/homebridge-plugin-emporia.git
cd homebridge-plugin-emporia
npm install
```

### 3. First Build

```bash
npm run build
```

You should see output like:

```
> homebridge-plugin-emporia@1.0.0 build
> tsc

✨  Done in 2.34s
```

The compiled JavaScript will be in the `dist/` directory.

## Development Workflow

### Option 1: Docker Test Environment (Recommended)

This is the easiest way to test without affecting your main Homebridge:

1. **Configure test environment**:

Edit `test/hbConfig/config.json`:

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "YOUR_EMAIL@example.com",
      "password": "YOUR_PASSWORD",
      "debug": true
    }
  ]
}
```

2. **Start the test environment**:

```bash
./docker-test.sh start
```

3. **View logs**:

```bash
./docker-test.sh logs
```

4. **Make changes and rebuild**:

```bash
# In watch mode (auto-rebuild on file changes)
npm run watch

# Then restart the container
./docker-test.sh restart
```

5. **Access Homebridge UI**:

Open http://localhost:8581 in your browser.

6. **Stop when done**:

```bash
./docker-test.sh stop
```

### Option 2: Local Homebridge Installation

If you have Homebridge installed locally:

1. **Link the plugin**:

```bash
npm run build
npm link
```

2. **Configure Homebridge**:

Edit `~/.homebridge/config.json` and add the platform configuration.

3. **Start Homebridge in debug mode**:

```bash
homebridge -D
```

4. **Watch for changes**:

In another terminal:

```bash
npm run watch
```

5. **Restart Homebridge** after changes to see them take effect.

## Making Your First Change

Let's make a simple change to verify your setup works:

### 1. Edit the Platform

Open `src/platform.ts` and find the constructor. Add a log message:

```typescript
constructor(
  public readonly log: Logging,
  public readonly config: EmporiaPlatformConfig,
  public readonly homebridgeApi: API,
) {
  // ... existing code ...
  
  this.log.info('🎉 Hello from my custom change!');
  
  // ... rest of constructor ...
}
```

### 2. Rebuild

```bash
npm run build
```

### 3. Restart and Check Logs

#### With Docker:

```bash
./docker-test.sh restart
./docker-test.sh logs
```

Look for your custom message in the logs.

#### With Local Homebridge:

Restart Homebridge and check the logs for your message.

### 4. Remove the Change

Once verified, remove your test log message and rebuild.

## Common Tasks

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Type Checking

```bash
npx tsc --noEmit
```

### Viewing Docker Logs

```bash
./docker-test.sh logs
```

### Opening Shell in Container

```bash
./docker-test.sh shell
```

### Rebuilding Everything

```bash
./docker-test.sh rebuild
```

### Cleaning Up

```bash
# Stop containers
./docker-test.sh stop

# Remove everything including volumes
./docker-test.sh clean
```

## Understanding the Code

### Key Files

1. **`src/index.ts`**: Entry point, registers the platform
2. **`src/platform.ts`**: Main platform logic, device discovery
3. **`src/emporiaApi.ts`**: API client for Emporia Energy
4. **`src/outletAccessory.ts`**: Handles outlet devices
5. **`src/chargerAccessory.ts`**: Handles EV charger devices

### Flow

```
index.ts
  └─> Registers EmporiaEnergyPlatform
       └─> platform.ts constructor
            ├─> Initializes EmporiaApi
            └─> Waits for 'didFinishLaunching' event
                 └─> authenticateAndDiscoverDevices()
                      ├─> emporiaApi.login()
                      └─> discoverDevices()
                           ├─> getOutlets() -> creates OutletAccessory
                           └─> getChargers() -> creates ChargerAccessory
```

### Adding Debug Logging

Throughout your code, you can add:

```typescript
this.platform.log.debug('Debug message', { data: someData });
this.platform.log.info('Info message');
this.platform.log.warn('Warning message');
this.platform.log.error('Error message', error);
```

Debug logs only appear when `"debug": true` in config.

## Testing Your Changes

### Manual Testing Checklist

Before submitting changes:

- [ ] Plugin builds without errors
- [ ] Linter passes
- [ ] Type checking passes
- [ ] Plugin loads in Homebridge
- [ ] Devices appear in HomeKit
- [ ] Devices can be controlled
- [ ] Logs show no errors
- [ ] Configuration UI works (if changed)

### Docker Test Commands

```bash
# Full test cycle
./docker-test.sh clean
./docker-test.sh start
./docker-test.sh logs
# Test functionality in Home app
./docker-test.sh stop
```

## Getting Help

### Check Logs

Logs are your best friend:

```bash
# Docker
./docker-test.sh logs

# Local Homebridge
tail -f ~/.homebridge/homebridge.log
```

### Common Errors

**"Cannot find module"**: Run `npm install`

**"Command not found"**: Install Node.js

**TypeScript errors**: Run `npm run build` to see full errors

**Plugin not loading**: Check logs, verify build succeeded

### Documentation

- See `DEVELOPMENT.md` for detailed development guide
- See `README.md` for user documentation
- Check Homebridge docs: https://developers.homebridge.io/

## Next Steps

Once you're comfortable with the basics:

1. Review the Emporia API in `src/emporiaApi.ts`
2. Study how accessories work in `src/outletAccessory.ts`
3. Look at the configuration schema in `config.schema.json`
4. Read the full `DEVELOPMENT.md` guide
5. Check open issues on GitHub for contribution ideas

## Quick Reference

```bash
# Build
npm run build

# Watch mode
npm run watch

# Lint
npm run lint
npm run lint:fix

# Docker
./docker-test.sh start|stop|restart|logs|shell|clean

# Type check
npx tsc --noEmit

# Link locally
npm link
```

Happy coding! 🚀

