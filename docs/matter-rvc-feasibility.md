# OSOJI X420 — Matter RVC: feasibility and isolation plan (2026-11-15)

## Verified baseline

- Working HAP `Fanv2` in Apple Casa: start and dock via atomic LAN scene, suction via DP14 normal/strong and `RotationSpeed`. Keep this as production fallback.
- Experimentally exposed four HAP switches for modes; user observed all were labeled OSOJI and briefly disabled on selection. The settings `allowExperimentalModes=false` should stay disabled.
- Tuya functions: `smart`, `random`, `spiral`, `wall_follow` as candidate cleaning modes. Only `smart` start/dock physically validated. Do not assume others work.

## Matter API verification

Homebridge 2 has opt-in, per-plugin `api.matter`, with supported `RoboticVacuumCleaner` type. Homebridge's Matter reference documents `RvcRunMode`, `RvcCleanMode` and optional `rvcCleanMode.directModeChange` which must only be set if a `changeToMode` handler safely supports changes during cleaning. In Homebridge 2.5 RVC is commissioned as a separate Matter node with its own QR rather than using the ordinary HAP pairing. See:
- https://developers.homebridge.io/homebridge/
- https://github-wiki-see.page/m/homebridge-plugins/homebridge-matter/wiki/Section-12-Robotic
- https://github-wiki-see.page/m/homebridge-plugins/homebridge-matter/wiki/API-Reference

Known compatibility risk: reported Apple Home "Updating…" with a Homebridge Matter RVC, https://github.com/homebridge/homebridge/issues/3951 (2026). Never remove the existing HAP accessory based on Matter pairing success alone.

## Stepwise delivery plan

1. Extract independent read-only `VacuumState` containing phase, battery, mode, suction, observed timestamp; enforce unknown state rather than fabricate values. Keep current HAP behavior unchanged.
2. Prepare an **opt-in** Matter RVC adapter in a separate module. Default OFF. Do not introduce Matter config or pairing automatically.
3. Only advertise supported mode names after confirming how Apple Casa presents them. Initially restrict run actions to already validated LAN start/dock; do not expose untested motion modes.
4. Use read-only fixtures and fake-device unit tests to validate mode mapping, observed vs desired state, error handling, safe command gating, deduplication. No physical movement commands in CI.
5. Run on a **separate test Matter node**, keep HAP Fanv2 functional, verify Apple Home does not remain stuck on Updating and actually shows run/clean mode controls.
6. Physically test the three new modes one at a time with owner present before enabling direct mode change.
7. Keep a documented kill switch and immediate rollback; do not erase cached HAP accessories or rotate credentials during experiments.

## Acceptance

- Apple Casa presents an identifiable OSOJI robotic vacuum and a usable mode picker.
- Existing fan accessory continues to start/dock and adjust suction throughout experiment.
- State matches LAN DP3/DP5; read errors never imply a successful mode switch.
- RVC pairing is separate; the owner controls commissioning and physical tests.
- No raw device IDs, local keys, credentials or cloud project information in repository.

## Adjacent Tuya recovery work

Separate from this OSOJI repository: inventory failed Tuya lights/switches/plugs/pet feeder/lock, confirm local protocol, key availability, and supported device type before choosing a driver. Avoid multiple independent LAN connections to the same device. A local Tuya bridge is not necessarily isolated from Internet.
