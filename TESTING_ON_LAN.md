# Testing on Your LAN Homebridge Server

Guide to install and test this plugin on your existing Homebridge server.

## Prerequisites

- Homebridge already running on your LAN
- SSH access to your Homebridge server
- Node.js 18+ on the Homebridge server
- Your Emporia credentials

---

## Option 1: Clone and Build on Server (Best for Active Development)

This is the easiest method if you're making frequent changes.

### Step 1: Clone Repository on Server

```bash
# SSH to your Homebridge server
ssh homebridge

# Clone the repository (adjust path as needed)
cd ~/Projects  # or just ~
git clone https://github.com/sbates130272/homebridge-plugin-emporia.git

# Or if using SSH keys:
# git clone git@github.com:sbates130272/homebridge-plugin-emporia.git

cd homebridge-plugin-emporia
```

### Step 2: Build on Server

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Create tarball
npm pack
```

### Step 3: Install to Homebridge

**Important:** If you're using Homebridge Config UI X (most common), it uses
`--strict-plugin-resolution` which means plugins must be installed in
`/var/lib/homebridge/node_modules/`, NOT the global npm directory!

```bash
# For Homebridge Config UI X (--strict-plugin-resolution):
cd /var/lib/homebridge
sudo npm install ~/Projects/homebridge-plugin-emporia/homebridge-plugin-emporia-1.0.0.tgz

# Verify it's installed
ls -la /var/lib/homebridge/node_modules/ | grep emporia

# For standard Homebridge (without Config UI X):
# sudo npm install -g ~/Projects/homebridge-plugin-emporia/homebridge-plugin-emporia-1.0.0.tgz
```

### Step 4: Configure the Plugin

```bash
# Edit Homebridge config
# Location depends on your setup:
# - Config UI X: /var/lib/homebridge/config.json
# - Standard: ~/.homebridge/config.json
# - Docker: /var/lib/homebridge/config.json
# - hoobs: /var/lib/hoobs/config.json

# For Config UI X (most common):
sudo nano /var/lib/homebridge/config.json
```

Add this platform configuration:

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "your.email@example.com",
      "password": "your_password",
      "updateInterval": 30,
      "exposeOutlets": true,
      "exposeChargers": true,
      "exposeEnergyMonitoring": true,
      "debug": true
    }
  ]
}
```

### Step 5: Restart Homebridge

```bash
# For systemd (most common):
sudo systemctl restart homebridge

# For Docker:
docker restart homebridge

# Check it started:
sudo systemctl status homebridge
```

### Step 6: Watch the Logs

```bash
# For systemd:
sudo journalctl -u homebridge -f

# Look for:
# - "Loaded plugin: homebridge-plugin-emporia@1.0.0"
# - "Registering platform 'homebridge-plugin-emporia.EmporiaEnergy'"
# - "[Emporia Energy] Authenticating..."
# - "[Emporia Energy] Login successful"
# - "[Emporia Energy] Discovered X outlets"
```

**Success!** You should see your plugin load and devices appear in the Home app!

### Step 7: Updating After Code Changes

This is where this method shines! After you make changes:

```bash
# SSH to server
ssh homebridge

# Pull latest changes
cd ~/Projects/homebridge-plugin-emporia
git pull

# Rebuild and repackage
npm run build
npm pack

# Reinstall to Homebridge
cd /var/lib/homebridge
sudo npm install ~/Projects/homebridge-plugin-emporia/homebridge-plugin-emporia-1.0.0.tgz

# Restart Homebridge
sudo systemctl restart homebridge

# Watch logs
sudo journalctl -u homebridge -f
```

**Advantages:**
- ✅ Easy to update (just `git pull && npm run build`)
- ✅ No need to copy files back and forth
- ✅ Direct access to git history
- ✅ Can test different branches easily

**Disadvantages:**
- ⚠️ Requires git and build tools on server
- ⚠️ Slightly slower if server is resource-constrained

### Testing Different Branches

```bash
# Create and test a feature branch
cd ~/Projects/homebridge-plugin-emporia
git checkout -b test-feature
git pull origin test-feature
npm run build
npm pack

# Reinstall
cd /var/lib/homebridge
sudo npm install ~/Projects/homebridge-plugin-emporia/homebridge-plugin-emporia-1.0.0.tgz
sudo systemctl restart homebridge

# Switch back to main
cd ~/Projects/homebridge-plugin-emporia
git checkout main
npm run build
npm pack

# Reinstall
cd /var/lib/homebridge
sudo npm install ~/Projects/homebridge-plugin-emporia/homebridge-plugin-emporia-1.0.0.tgz
sudo systemctl restart homebridge
```

### Cleanup When Done

```bash
# Remove the plugin
cd /var/lib/homebridge
sudo npm uninstall homebridge-plugin-emporia

# For standard Homebridge (without Config UI X):
# sudo npm uninstall -g homebridge-plugin-emporia

# Remove the repository (optional)
rm -rf ~/Projects/homebridge-plugin-emporia

# Restart Homebridge
sudo systemctl restart homebridge
```

---

## Option 2: Install from Local Build (Good for Stable Testing)

### Step 1: Build the Plugin Locally

```bash
# On your development machine (this one)
cd /home/stebates/Projects/homebridge-plugin-emporia

# Install dependencies and build
npm install
npm run build

# Create a tarball
npm pack

# This creates: homebridge-plugin-emporia-1.0.0.tgz
```

### Step 2: Copy to Homebridge Server

```bash
# Check your ~/.ssh/config for the server alias
# Assuming your server is configured as 'homebridge' or similar

# Copy the tarball
scp homebridge-plugin-emporia-1.0.0.tgz homebridge:~/

# Or if direct IP/hostname:
# scp homebridge-plugin-emporia-1.0.0.tgz user@192.168.1.x:~/
```

### Step 3: Install on Homebridge Server

```bash
# SSH to your Homebridge server
ssh homebridge

# For Homebridge Config UI X (most common):
cd /var/lib/homebridge
sudo npm install ~/homebridge-plugin-emporia-1.0.0.tgz

# Verify installation
ls -la /var/lib/homebridge/node_modules/ | grep emporia

# For standard Homebridge (without Config UI X):
# sudo npm install -g ~/homebridge-plugin-emporia-1.0.0.tgz

# Or if Homebridge runs in Docker:
# docker cp homebridge-plugin-emporia-1.0.0.tgz homebridge:/tmp/
# docker exec homebridge sh -c \
#   "cd /var/lib/homebridge && npm install /tmp/homebridge-plugin-emporia-1.0.0.tgz"
```

### Step 4: Configure the Plugin

```bash
# Edit Homebridge config
# Location depends on your setup:
# - Config UI X: /var/lib/homebridge/config.json
# - Standard: ~/.homebridge/config.json
# - Docker: /var/lib/homebridge/config.json
# - hoobs: /var/lib/hoobs/config.json

# For Config UI X (most common):
sudo nano /var/lib/homebridge/config.json
```

Add this platform configuration:

```json
{
  "platforms": [
    {
      "platform": "EmporiaEnergy",
      "name": "Emporia Energy",
      "username": "your.email@example.com",
      "password": "your_password",
      "updateInterval": 30,
      "exposeOutlets": true,
      "exposeChargers": true,
      "exposeEnergyMonitoring": true,
      "debug": true
    }
  ]
}
```

**Important:** Make sure to:
- Replace `your.email@example.com` with your Emporia account email
- Replace `your_password` with your Emporia password
- Keep `debug: true` for initial testing

### Step 5: Restart Homebridge

```bash
# For systemd (most common):
sudo systemctl restart homebridge

# For Docker:
docker restart homebridge

# For hoobs:
sudo systemctl restart hoobs

# Check it started successfully:
sudo systemctl status homebridge
```

### Step 6: Watch the Logs

```bash
# For systemd:
sudo journalctl -u homebridge -f

# For Docker:
docker logs -f homebridge

# Look for:
# - "[Emporia Energy] Loaded plugin"
# - "[Emporia Energy] Authenticating..."
# - "[Emporia Energy] Login successful"
# - "[Emporia Energy] Discovered X outlets"
```

---

## Option 2: Install via NPM Link (For Active Development)

This method is better if you're making frequent changes and want to test 
them immediately.

### Step 1: Build Locally

```bash
cd /home/stebates/Projects/homebridge-plugin-emporia
npm install
npm run build
```

### Step 2: Create Global Link

```bash
# Create a global symlink
sudo npm link

# Verify it worked
npm list -g homebridge-plugin-emporia
```

### Step 3: Configure and Restart

Same as Option 1, Steps 4-6 above.

### Step 4: For Each Code Change

```bash
# Make your changes
vim src/platform.ts

# Rebuild
npm run build

# Homebridge will auto-reload if you have nodemon/watch configured
# Otherwise restart manually:
sudo systemctl restart homebridge
```

### Step 5: Unlink When Done

```bash
# Remove the global link
sudo npm unlink -g homebridge-plugin-emporia
```

---

## Option 3: Install via Homebridge UI (After npm Publish)

Once published to npm, you can use the Homebridge Config UI:

1. Open Homebridge UI (usually http://homebridge.local or http://IP:8581)
2. Go to "Plugins" tab
3. Search for "emporia"
4. Click "Install"
5. Configure via the UI form
6. Restart Homebridge

---

## Verification Steps

### 1. Check Plugin Loaded

```bash
# Look in logs for:
grep "Emporia" ~/.homebridge/homebridge.log

# Or:
sudo journalctl -u homebridge | grep Emporia
```

You should see:
```
[Emporia Energy] Loaded homebridge-plugin-emporia v1.0.0
[Emporia Energy] Finished initializing platform: EmporiaEnergy
```

### 2. Check Authentication

Look for:
```
[Emporia Energy] Authenticating with Emporia Energy...
[Emporia Energy] Login successful
```

If you see errors:
- `Invalid credentials` - Check username/password
- `403 Forbidden` - Check network connectivity to AWS Cognito
- `Connection timeout` - Check firewall/network settings

### 3. Check Device Discovery

Look for:
```
[Emporia Energy] Discovered 3 outlets
[Emporia Energy] Adding new accessory: Living Room Outlet
[Emporia Energy] Configuring accessory: Living Room Outlet
```

### 4. Check in HomeKit

1. Open Home app on iPhone/iPad
2. Look for your Emporia devices
3. They should show as "Outlet" accessories
4. Test turning on/off
5. Check if energy monitoring appears (if enabled)

### 5. Check Energy Monitoring

If `exposeEnergyMonitoring: true`, look for:
```
[Emporia Energy] Living Room Outlet - Power: 125.5W, Total: 0.023kWh
```

---

## Troubleshooting

### Plugin Not Loading

**First, check your Homebridge startup flags in the logs:**

```bash
sudo journalctl -u homebridge | grep "Starting Homebridge with extra flags"
```

If you see `-P /var/lib/homebridge/node_modules --strict-plugin-resolution`,
you're using Config UI X and plugins must be in `/var/lib/homebridge/node_modules/`.

```bash
# For Config UI X:
# Check plugin is installed in the Homebridge directory
ls -la /var/lib/homebridge/node_modules/ | grep emporia

# Reinstall if needed
cd /var/lib/homebridge
sudo npm uninstall homebridge-plugin-emporia
sudo npm install ~/homebridge-plugin-emporia-1.0.0.tgz

# For standard Homebridge:
# Check plugin is installed globally
npm list -g | grep homebridge-plugin-emporia

# Reinstall if needed
sudo npm uninstall -g homebridge-plugin-emporia
sudo npm install -g ~/homebridge-plugin-emporia-1.0.0.tgz
```

### Authentication Failing

```bash
# Test credentials with curl (simulating Cognito)
# Check if you can login to https://web.emporiaenergy.com/

# Enable debug logging in config.json:
"debug": true

# Check for detailed error messages
```

### Devices Not Appearing in HomeKit

```bash
# Check cached accessories
ls -la ~/.homebridge/accessories/

# If stale, you can clear cache (WARNING: removes ALL accessories)
rm ~/.homebridge/accessories/cachedAccessories
sudo systemctl restart homebridge

# Better: Remove just Emporia accessories via Homebridge UI
```

### Energy Monitoring Shows Zero

```bash
# Check if your devices support energy monitoring
# - Smart outlets: Usually YES
# - EV chargers: Usually YES
# - Vue monitors: YES (but as separate device, not outlet)

# Try with debug enabled and watch for API errors
"debug": true

# Check API response in logs
```

### High CPU Usage

```bash
# Check update interval isn't too aggressive
"updateInterval": 60  # Increase from 30 to 60 seconds

# Disable energy monitoring if not needed
"exposeEnergyMonitoring": false
```

---

## Testing Checklist

Before considering it production-ready:

- [ ] Plugin loads without errors
- [ ] Authentication succeeds
- [ ] All outlets discovered
- [ ] All chargers discovered (if you have any)
- [ ] Devices appear in Home app
- [ ] Can turn outlets on/off from Home app
- [ ] State updates appear in Home app within updateInterval
- [ ] Energy monitoring displays power readings (if enabled)
- [ ] HomeKit automations work
- [ ] Scenes including outlets work
- [ ] Siri commands work ("Hey Siri, turn on Living Room Outlet")
- [ ] No errors in logs after 24 hours
- [ ] Accessories survive Homebridge restart
- [ ] Authentication tokens refresh automatically

---

## Monitoring in Production

### Check Status

```bash
# View recent logs
sudo journalctl -u homebridge --since "1 hour ago" | grep Emporia

# Check for errors
sudo journalctl -u homebridge | grep -i error | grep -i emporia

# Check token refresh
sudo journalctl -u homebridge | grep "Refreshing access token"
```

### Performance

```bash
# Check Homebridge process
top -p $(pgrep homebridge)

# Check memory usage
ps aux | grep homebridge

# Check API call frequency
sudo journalctl -u homebridge | grep "Making API request" | tail -20
```

### Long-term

- Monitor logs weekly for errors
- Check if devices stay responsive
- Verify token refresh works (tokens expire after 1 hour)
- Ensure no memory leaks over time

---

## Updating the Plugin

When you make changes:

```bash
# 1. Build new version
cd /home/stebates/Projects/homebridge-plugin-emporia
npm run build
npm version patch  # Bumps to 1.0.1

# 2. Create new tarball
npm pack

# 3. Copy to server
scp homebridge-plugin-emporia-1.0.1.tgz homebridge:~/

# 4. Install update
ssh homebridge
sudo npm install -g ~/homebridge-plugin-emporia-1.0.1.tgz

# 5. Restart
sudo systemctl restart homebridge

# 6. Verify
sudo journalctl -u homebridge -f
```

---

## Rollback if Needed

```bash
# On Homebridge server
ssh homebridge

# Uninstall current version
sudo npm uninstall -g homebridge-plugin-emporia

# Reinstall previous version
sudo npm install -g ~/homebridge-plugin-emporia-1.0.0.tgz

# Restart
sudo systemctl restart homebridge
```

---

## Common Homebridge Server Configurations

### Raspberry Pi with systemd

```bash
# Config location: ~/.homebridge/config.json
# Restart: sudo systemctl restart homebridge
# Logs: sudo journalctl -u homebridge -f
```

### Docker (oznu/homebridge)

```bash
# Config location: /var/lib/homebridge/config.json (on host)
# Copy tarball to: docker cp file.tgz homebridge:/tmp/
# Install: docker exec homebridge npm install -g /tmp/file.tgz
# Restart: docker restart homebridge
# Logs: docker logs -f homebridge
```

### HOOBS

```bash
# Config location: /var/lib/hoobs/config.json
# Install via HOOBS UI: Plugins → Install Local Plugin
# Or CLI: sudo npm install -g file.tgz
# Restart: sudo systemctl restart hoobs
# Logs: sudo journalctl -u hoobs -f
```

### Synology NAS

```bash
# Usually Docker-based
# Use Synology Docker UI or docker commands
# Config in Docker volume: /homebridge/config.json
```

---

## Security Considerations

### Protect Credentials

Your Emporia username/password are in `config.json`. Make sure:

```bash
# Check permissions
ls -la ~/.homebridge/config.json
# Should be: -rw------- (600) or -rw-r----- (640)

# Fix if needed:
chmod 600 ~/.homebridge/config.json
```

### Token Storage

Tokens are cached in `~/.homebridge/emporia-tokens.json`:

```bash
# Check it's created
ls -la ~/.homebridge/emporia-tokens.json

# Permissions should be restrictive
chmod 600 ~/.homebridge/emporia-tokens.json
```

### Network

- Emporia API uses HTTPS (secure)
- Cognito authentication uses TLS
- Local HomeKit communication is encrypted
- No ports need to be opened for outbound API calls

---

## Quick Reference

```bash
# Build and package
npm run build && npm pack

# Copy to server
scp homebridge-plugin-emporia-*.tgz homebridge:~/

# Install on server
ssh homebridge "sudo npm install -g ~/homebridge-plugin-emporia-*.tgz"

# Restart Homebridge
ssh homebridge "sudo systemctl restart homebridge"

# Watch logs
ssh homebridge "sudo journalctl -u homebridge -f"
```

---

## Next Steps

After successful testing on your LAN:

1. ✅ Verify everything works for 24-48 hours
2. 📸 Take screenshots of Home app showing your devices
3. 📝 Update README.md with screenshots
4. 🚀 Publish to npm (see PUBLISHING_GUIDE.md)

---

## Getting Help

If you encounter issues:

1. Check logs with `debug: true`
2. Verify credentials work on https://web.emporiaenergy.com/
3. Test API access from server: `curl -v https://api.emporiaenergy.com/`
4. Check Homebridge logs for plugin load errors
5. Review HomeKit accessory cache

**Need help?** Once published, users can file issues on GitHub!

