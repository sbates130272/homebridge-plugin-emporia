# Publishing Guide for homebridge-plugin-emporia

Complete step-by-step guide to publish this plugin to npm and get Homebridge verification.

## Pre-Publishing Checklist Status

### ✅ Completed
- [x] Repository URLs updated
- [x] LICENSE file added
- [x] Package.json configured
- [x] Config schema validated
- [x] CI/CD pipeline working
- [x] Code quality checks passing
- [x] Energy monitoring implemented

### ⚠️ Remaining Before Publishing
- [ ] Test energy monitoring with real devices
- [ ] Test in HomeKit app (pair and verify)
- [ ] Add screenshots to README
- [ ] Test package locally (`npm pack`)

---

## Step 1: Final Testing (Required)

### A. Test Energy Monitoring
```bash
# Start Homebridge with energy monitoring enabled
./docker-test.sh start

# Watch logs for power readings
./docker-test.sh logs -f

# Look for messages like:
# "Emporia Outlet 123456 - Power: 125.5W, Total: 0.023kWh"
```

### B. Test in HomeKit
1. Open Home app on iPhone/iPad
2. Add Accessory
3. Scan QR code from: http://localhost:8581
4. Verify all outlets appear
5. Test on/off control
6. Check energy characteristics display

**Don't proceed until both tests pass!**

---

## Step 2: Prepare for Release

### A. Update Version Number
```bash
# For first release, version should be 1.0.0 (already set)
# For future releases:
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
```

### B. Update CHANGELOG.md
Add release notes:
```markdown
## [1.0.0] - 2025-11-18

### Added
- Initial release
- Smart outlet control via HomeKit
- EV charger control
- Energy monitoring for outlets
- AWS Cognito authentication
- Automatic device discovery
- Token caching to minimize API calls

### Supported Devices
- Emporia Smart Outlets/Plugs
- Emporia EV Chargers (EVSE)
```

### C. Create Git Tag
```bash
# Commit any final changes
git add CHANGELOG.md
git commit -S -m "chore: prepare v1.0.0 release"

# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial public release"

# Push everything
git push origin main --follow-tags
```

---

## Step 3: Test Package Locally

### A. Create Package
```bash
# Create tarball
npm pack

# This creates: homebridge-plugin-emporia-1.0.0.tgz
```

### B. Test Installation
```bash
# Install globally from tarball
npm install -g homebridge-plugin-emporia-1.0.0.tgz

# Verify it works
homebridge -D

# Check it appears in Homebridge UI
# Open: http://localhost:8581
```

### C. Test Uninstall/Reinstall
```bash
# Uninstall
npm uninstall -g homebridge-plugin-emporia

# Reinstall
npm install -g homebridge-plugin-emporia-1.0.0.tgz

# Verify devices persist correctly
```

**If everything works, proceed to Step 4!**

---

## Step 4: NPM Account Setup

### A. Create NPM Account (if needed)
1. Go to: https://www.npmjs.com/signup
2. Create account
3. Verify email

### B. Enable 2FA (REQUIRED for publishing)
1. Go to: https://www.npmjs.com/settings/YOUR_USERNAME/twofa
2. Enable "Authorization and Publishing"
3. Use authenticator app (Google Authenticator, Authy, etc.)

### C. Login from Terminal
```bash
npm login

# Enter:
# - Username
# - Password
# - Email
# - 2FA code
```

### D. Verify Login
```bash
npm whoami
# Should show your username
```

---

## Step 5: Publish to NPM

### A. Final Pre-Publish Check
```bash
# Make sure everything is committed
git status

# Verify package.json
cat package.json | jq '.name, .version, .repository'

# Check what will be published
npm pack --dry-run

# Run prepublish script
npm run prepublishOnly
```

### B. Publish!
```bash
# Publish to npm (public)
npm publish --access public

# Enter 2FA code when prompted
```

### C. Verify Publication
1. Visit: https://www.npmjs.com/package/homebridge-plugin-emporia
2. Check package page loads
3. Verify README displays correctly
4. Check version number is correct

---

## Step 6: Verify Installation from NPM

### A. Test Installation
```bash
# Uninstall local version
npm uninstall -g homebridge-plugin-emporia

# Install from npm
npm install -g homebridge-plugin-emporia

# Verify it works
homebridge -D
```

### B. Test in Fresh Environment
```bash
# Use Docker to test clean install
docker run --rm -it oznu/homebridge:latest bash

# Inside container:
npm install -g homebridge-plugin-emporia
# Should install successfully
```

---

## Step 7: Post-Publication Tasks

### A. Update Repository
```bash
# Add npm badge to README (if not already there)
# The badge should now show v1.0.0

# Create GitHub Release
# Go to: https://github.com/sbates130272/homebridge-plugin-emporia/releases/new
# - Tag: v1.0.0
# - Title: v1.0.0 - Initial Release
# - Description: Copy from CHANGELOG.md
# - Attach: homebridge-plugin-emporia-1.0.0.tgz
```

### B. Announce
Consider announcing in:
- Reddit: r/homebridge
- Homebridge Discord: https://discord.gg/homebridge
- GitHub Discussions

---

## Step 8: Apply for Homebridge Verification (After 100+ Downloads)

### Requirements for Verified Badge:
- ✅ Published to npm
- ✅ Name starts with `homebridge-`
- ✅ Has `homebridge-plugin` keyword
- ✅ Working config.schema.json
- ✅ Active maintenance
- ⏳ Minimum 100 weekly downloads
- ⏳ No critical bugs

### Application Process:
1. Wait until you have 100+ weekly downloads
2. Go to: https://github.com/homebridge/homebridge/wiki/Verified-Plugins
3. Follow the application instructions
4. Submit PR to homebridge/verified

### Verification Benefits:
- ✅ "Verified" badge in Homebridge UI
- ✅ Higher visibility in plugin search
- ✅ User trust and credibility
- ✅ Featured in "Verified Plugins" list

---

## Troubleshooting

### "Package already exists"
```bash
# You can't republish the same version
# Bump version and try again:
npm version patch
npm publish --access public
```

### "Need 2FA code"
```bash
# Make sure 2FA is enabled for publishing
# Get code from authenticator app
```

### "Package name taken"
```bash
# If someone else has homebridge-plugin-emporia:
# Change name in package.json
# Suggestions:
#   - homebridge-emporia-vue
#   - homebridge-emporia-energy
#   - homebridge-emporia-outlet
```

### "403 Forbidden"
```bash
# Check you're logged in:
npm whoami

# Verify email is confirmed on npm
# Check 2FA is enabled
```

---

## Maintenance After Publishing

### For Bug Fixes:
```bash
# Fix the bug
git commit -m "fix: description of fix"

# Bump patch version
npm version patch  # 1.0.0 -> 1.0.1

# Update CHANGELOG.md
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: release v1.0.1"

# Tag and publish
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin main --follow-tags
npm publish
```

### For New Features:
```bash
# Add the feature
git commit -m "feat: description of feature"

# Bump minor version
npm version minor  # 1.0.1 -> 1.1.0

# Update CHANGELOG.md
# Tag and publish (same as above)
```

### For Breaking Changes:
```bash
# Make breaking change
git commit -m "feat!: breaking change description"

# Bump major version
npm version major  # 1.1.0 -> 2.0.0

# Update CHANGELOG.md with migration guide
# Tag and publish
```

---

## Quick Reference: Publishing Checklist

```bash
# 1. Final tests
./docker-test.sh start
# Test in HomeKit app

# 2. Update CHANGELOG.md
vim CHANGELOG.md

# 3. Commit and tag
git commit -a -m "chore: prepare v1.0.0 release"
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Test package
npm pack
npm install -g homebridge-plugin-emporia-1.0.0.tgz
# Test it works

# 5. Login to npm
npm login

# 6. Publish
npm publish --access public

# 7. Push to GitHub
git push origin main --follow-tags

# 8. Create GitHub Release
# Go to GitHub releases page

# 9. Announce
# Post to r/homebridge, Discord, etc.
```

---

## Support After Publication

### Responding to Issues:
- Check GitHub Issues daily
- Respond within 48 hours
- Label issues appropriately (bug, enhancement, question)
- Close fixed issues with release note

### Updating Documentation:
- Keep README.md current
- Add FAQ section as questions arise
- Update troubleshooting with common issues

### Monitoring:
- Watch npm download stats: https://npm-stat.com/charts.html?package=homebridge-plugin-emporia
- Check Homebridge verified status
- Monitor GitHub stars/issues

---

## Success Metrics

### Initial Success:
- [ ] Published to npm
- [ ] 10+ downloads in first week
- [ ] No critical bugs reported
- [ ] Working in Homebridge UI

### Long-term Success:
- [ ] 100+ weekly downloads
- [ ] Homebridge verified badge
- [ ] Active user community
- [ ] Regular updates and maintenance

---

## Resources

- **NPM Documentation**: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- **Homebridge Plugin Dev**: https://developers.homebridge.io/
- **Homebridge Verified**: https://github.com/homebridge/homebridge/wiki/Verified-Plugins
- **Semantic Versioning**: https://semver.org/
- **Keep a Changelog**: https://keepachangelog.com/

---

**Good luck with your publication! 🚀**

Remember: The most important thing is that the plugin works reliably. Test thoroughly before publishing!

