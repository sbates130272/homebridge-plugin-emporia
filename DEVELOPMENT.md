# Development Guide

This document provides detailed information for developers working on the 
Homebridge Emporia Energy plugin.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- TypeScript 5.x
- Docker and Docker Compose (for testing)
- A Homebridge installation (for testing)
- An Emporia Energy account with devices

## Project Structure

```
homebridge-plugin-emporia/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── platform.ts           # Main platform implementation
│   ├── settings.ts           # Plugin constants
│   ├── emporiaApi.ts         # Emporia API client
│   ├── outletAccessory.ts    # Outlet device handler
│   ├── chargerAccessory.ts   # EV charger device handler
│   └── @types/               # TypeScript type definitions
├── test/
│   └── hbConfig/             # Test Homebridge configuration
├── dist/                     # Compiled JavaScript (generated)
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD
├── docker-compose.yml        # Docker test environment
├── Dockerfile.dev            # Development container
├── docker-test.sh            # Docker test harness script
├── config.schema.json        # Plugin configuration schema
├── package.json              # NPM package definition
├── tsconfig.json             # TypeScript configuration
├── eslint.config.js          # ESLint configuration
├── .cspell.json              # Spell check configuration
└── README.md                 # User documentation
```

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/homebridge-plugin-emporia.git
cd homebridge-plugin-emporia
npm install
```

### 2. Build the Plugin

```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### 3. Development Workflow

#### Watch Mode

For active development with automatic recompilation:

```bash
npm run watch
```

This will watch for file changes and recompile automatically.

#### Linting

Run ESLint to check code quality:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

#### Type Checking

Verify TypeScript types without compiling:

```bash
npx tsc --noEmit
```

## Testing

### Local Testing with Homebridge

1. Build the plugin:

```bash
npm run build
```

2. Link to your global Homebridge installation:

```bash
npm link
```

3. Configure in `~/.homebridge/config.json`:

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "your-email@example.com",
      "password": "your-password",
      "debug": true
    }
  ]
}
```

4. Start Homebridge in debug mode:

```bash
homebridge -D
```

5. Make changes, rebuild, and restart Homebridge to test.

### Docker Testing

The recommended way to test is using the Docker test harness:

```bash
# Update test/hbConfig/config.json with your credentials
./docker-test.sh start    # Start Homebridge
./docker-test.sh logs     # View logs
./docker-test.sh stop     # Stop when done
```

See README.md for more Docker commands.

## Architecture

### Plugin Flow

1. **Initialization** (`platform.ts`)
   - Homebridge calls the platform constructor
   - Platform initializes the Emporia API client
   - Loads cached authentication tokens if available

2. **Authentication** (`emporiaApi.ts`)
   - Authenticates with Emporia API using credentials
   - Receives access tokens (ID, access, refresh)
   - Caches tokens to disk for reuse
   - Auto-refreshes tokens when expired

3. **Device Discovery** (`platform.ts`)
   - After Homebridge finishes launching
   - Fetches outlets and chargers from API
   - Creates or restores accessories
   - Registers accessories with Homebridge

4. **Accessory Handlers** (`outletAccessory.ts`, `chargerAccessory.ts`)
   - Each device gets an accessory instance
   - Handles HomeKit get/set requests
   - Polls API for status updates
   - Updates HomeKit with new state

### API Client (`emporiaApi.ts`)

The API client wraps the Emporia REST API:

- **Authentication**: Login, token refresh
- **Device Management**: Get devices, outlets, chargers
- **Device Control**: Update outlet/charger state
- **Energy Data**: Fetch usage statistics

### Accessories

#### Outlet Accessory (`outletAccessory.ts`)

- **Service Type**: Outlet
- **Characteristics**:
  - On (get/set)
  - OutletInUse (get)
- **Features**:
  - Turn on/off via HomeKit
  - Status polling
  - Energy monitoring (optional)

#### Charger Accessory (`chargerAccessory.ts`)

- **Service Type**: Switch (no native EVSE type in HomeKit)
- **Characteristics**:
  - On (get/set)
- **Features**:
  - Start/stop charging
  - Status polling
  - Power consumption tracking

### Configuration Schema

The `config.schema.json` file defines the plugin configuration UI in 
Homebridge Config UI X. It includes:

- Field definitions (name, type, validation)
- Layout sections (account, devices, advanced)
- Help text and defaults

## API Integration

### Emporia API Endpoints

Based on PyEmVue implementation:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/customer/authenticate` | POST | Login with credentials |
| `/customer/refresh` | POST | Refresh access token |
| `/customers/devices` | GET | Get all devices |
| `/devices/{gid}/locationProperties` | GET | Get device properties |
| `/customers/outlets` | GET | Get all outlets |
| `/devices/outlet` | PUT | Update outlet state |
| `/customers/evchargers` | GET | Get all EV chargers |
| `/devices/evcharger` | PUT | Update charger state |
| `/devices/usage` | POST | Get energy usage data |

### Authentication Flow

1. POST credentials to `/customer/authenticate`
2. Receive `idToken`, `accessToken`, `refreshToken`
3. Cache tokens to `emporia-tokens.json`
4. Include `authtoken` header in subsequent requests
5. Auto-refresh when token expires (401 response)

### Rate Limiting

The Emporia API has undocumented rate limits. Best practices:

- Cache authentication tokens
- Use reasonable update intervals (60+ seconds)
- Implement exponential backoff on errors
- Avoid parallel requests to the same endpoint

## Code Style

### TypeScript Guidelines

- Use strict type checking
- Prefer interfaces over types
- Use readonly when appropriate
- Avoid `any` (use `unknown` if needed)
- Document public methods with JSDoc

### ESLint Rules

Key rules enforced:

- Single quotes for strings
- 2-space indentation
- Semicolons required
- Max line length: 160 characters (warn)
- Trailing commas in multiline
- Prefer arrow functions

### Formatting

- Lines should be kept within 80 characters when possible
- Use spaces, not tabs
- Unix line endings (LF)
- Add newline at end of file

## CI/CD

### GitHub Actions

The CI workflow (`.github/workflows/ci.yml`) runs on push and PR:

1. **Lint and Type Check** (Node 18.x, 20.x)
   - Install dependencies
   - Run ESLint
   - Type check with TypeScript
   - Build the plugin

2. **Spell Check**
   - Check all TypeScript, JavaScript, JSON, and Markdown files
   - Uses CSpell with custom dictionary

3. **Test**
   - Run test suite (currently minimal)

### Pre-commit Checks

Before committing, ensure:

```bash
npm run lint        # No linting errors
npm run build       # Builds successfully
git status          # No unintended files
```

## Publishing

### Pre-release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - builds successfully
- [ ] Test locally with Docker or Homebridge
- [ ] Update README if needed
- [ ] Commit all changes
- [ ] Create git tag

### Publishing to NPM

```bash
# Ensure you're logged in
npm login

# Build and publish
npm publish

# Push to GitHub
git push origin main --tags
```

### Versioning

Follow Semantic Versioning (semver):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

## Troubleshooting

### Build Issues

**Problem**: TypeScript errors during build

```bash
# Clean and rebuild
rm -rf dist
npm run build
```

**Problem**: Module resolution errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Runtime Issues

**Problem**: Plugin not loading

- Check Homebridge logs for errors
- Verify `dist/index.js` exists
- Check plugin is installed: `npm list -g homebridge-plugin-emporia`

**Problem**: API authentication failing

- Verify credentials are correct
- Delete `emporia-tokens.json` and retry
- Check Emporia API status

### Docker Issues

**Problem**: Container won't start

```bash
# Check logs
./docker-test.sh logs

# Rebuild everything
./docker-test.sh clean
./docker-test.sh rebuild
```

## Contributing

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting: `npm run lint:fix`
5. Build: `npm run build`
6. Test thoroughly
7. Commit with descriptive message
8. Push to your fork
9. Submit a pull request

### Commit Messages

Follow conventional commits format:

```
feat: add charging rate control for EV chargers
fix: resolve outlet state synchronization issue
docs: update README with new configuration options
chore: update dependencies
```

### Code Review

All PRs require:

- Passing CI checks
- Code review approval
- Updated documentation if applicable
- Updated tests if applicable

## Resources

### Homebridge Development

- [Homebridge API Documentation](
  https://developers.homebridge.io/)
- [Plugin Development Guide](
  https://github.com/homebridge/homebridge/wiki/Plugin-Development)
- [Homebridge Verified Criteria](
  https://github.com/homebridge/homebridge/wiki/verified-Plugins)

### Emporia API

- [PyEmVue Library](https://github.com/magico13/PyEmVue)
- [PyEmVue API Docs](
  https://github.com/magico13/PyEmVue/blob/master/api_docs.md)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Docker

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](
  https://docs.docker.com/compose/)

## License

MIT License - see LICENSE file for details

