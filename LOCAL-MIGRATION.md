# OSOJI X420 — Local-first (verified LAN start and dock)

This branch preserves the original `OsojiVacuum` HomeKit accessory UUID and Switch service. It adds an **optional local transport** using the Python TinyTuya installation already confirmed on the Raspberry Pi.

## Before testing

* Back up `config.json` and the installed plugin before deployment. Keep `allowLocalCommands=false` until the updated code and unit tests have passed on the Raspberry Pi.
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
* `local`: reads DP5 for cleaning state. **Start** sends `{1: True, 2: True, 3: "smart"}` atomically; real device confirmed physical cleaning and `DP5=smart_clean`. **Dock** sends `{1: True, 2: False, 3: "chargego"}` atomically; user confirmed physical stop and return to charging base. Both sequences were tested on OSOJI X420 over Tuya LAN 3.4. HomeKit commands remain opt-in via `allowLocalCommands`.
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

After deployment on Homebridge, verify local status first and supervise a single HomeKit start/dock cycle. Turn `allowLocalCommands` off and disable automated scenes until verified through HomeKit. Check Homebridge stability and only after that test with WAN disconnected.

## Rollback

Disable `homebridge-tuya-osoji-vacuum` or restore the prior version in Homebridge UI; preserve `config.json` backups and original accessories.
