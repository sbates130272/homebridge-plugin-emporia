# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](
https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](
https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-17

### Added
- Initial release of Homebridge Emporia Energy plugin
- Support for Emporia smart outlets/plugs
- Support for Emporia EV chargers (EVSE)
- Automatic device discovery
- Real-time power consumption monitoring
- Persistent authentication token caching
- Configurable update intervals
- Docker-based test harness for development
- Comprehensive documentation
- GitHub Actions CI/CD pipeline with linting and spell checking

### Features
- Turn outlets on/off via HomeKit
- Start/stop EV charging via HomeKit
- View real-time power consumption
- Siri voice control support
- HomeKit automation support
- HomeKit scene integration

### Technical
- TypeScript implementation
- ESLint code quality checks
- Homebridge dynamic platform architecture
- Axios for HTTP API calls
- Support for Node.js 18+
- Support for Homebridge 1.8+

## [Unreleased]

### Planned Features
- Charging rate control for EV chargers
- Historical energy data tracking
- Support for individual circuit monitoring
- Integration with Eve app for advanced statistics
- Custom HomeKit characteristics for detailed energy data

