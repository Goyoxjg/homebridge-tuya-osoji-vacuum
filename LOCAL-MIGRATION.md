# OSOJI X420 — Local-first (experimental branch)

This branch preserves the original `OsojiVacuum` HomeKit accessory UUID and Switch service. It adds an **optional local transport** using the Python TinyTuya installation already confirmed on the Raspberry Pi.

## Before testing

* The production Homebridge plugin is currently disabled. Keep it disabled until a test build has passed.
* Use Homebridge 2.5.x and Node 24 for compatibility testing.
* OSOJI X420 was discovered at protocol 3.4 on the local network. Reserve a DHCP address for it.
* TinyTuya needs to be installed in the Python interpreter given by `pythonPath`.
* Never commit or paste the real local key into issues, CI logs, or the repository.

Example configuration **with placeholders only**:

```json
{
  "platform": "OsojiVacuum",
  "name": "Osoji Vacuum",
  "connectionMode": "local",
  "deviceId": "REPLACE_WITH_DEVICE_ID",
  "localIp": "192.168.1.105",
  "localKey": "REPLACE_WITH_LOCAL_KEY",
  "localVersion": "3.4",
  "allowLocalCommands": false,
  "pythonPath": "/home/homebridge/tinytuya-env/bin/python",
  "debug": false
}
```

## Behavior and limitations

* By default `allowLocalCommands=false` blocks all physical commands. Enable only after supervised validation.
* `local`: reads DP5 to determine whether cleaning and changes **only DP3** to `smart` for start or `chargego` for dock. This is **not yet device-verified**; perform a supervised physical test before enabling voice/automations.
* `cloud`: retains legacy cloud behavior.
* `auto`: local first; read-only status may fall back to cloud. Commands never fall back automatically to avoid double execution.
* A DP3 `smart` mode can coexist with charging status, so HomeKit On is determined from DP5 rather than DP3. The observed `charging_base` value is not treated as cleaning.
* The Python helper exchanges JSON over stdin/stdout; it does not send API keys to Tuya IoT Cloud.
* HomeKit still presents a Switch, not a native robot vacuum. Battery and filter values are not yet exposed.
* Local keys may change after re-pairing. Do not reset or re-pair a device to troubleshoot an initial failure.

## Tests

```bash
python3 -m unittest discover -s tests -v
npm ci
npm run build
```

After installation on a **test** Homebridge instance, verify local status first. Then supervise a single start and dock action. Check Homebridge stability and only after that test with WAN disabled.

## Rollback

Disable `homebridge-tuya-osoji-vacuum` or restore the prior version in Homebridge UI; preserve `config.json` backups and original accessories.
