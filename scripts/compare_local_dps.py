#!/usr/bin/env python3
"""Read-only snapshot/diff helper for Tuya LAN DPS. No arbitrary write commands."""
import argparse
import json
from pathlib import Path
import tinytuya

def capture(config_path):
    data = json.loads(config_path.read_text())
    platforms = [p for p in data.get("platforms", []) if p.get("platform") == "OsojiVacuum"]
    if len(platforms) != 1 or platforms[0].get("connectionMode") != "local":
        raise RuntimeError("Expected one local OsojiVacuum platform")
    cfg = platforms[0]
    device = tinytuya.Device(
        cfg["deviceId"], cfg["localIp"], cfg["localKey"],
        version=float(cfg.get("localVersion", "3.4"))
    )
    device.set_socketTimeout(5)
    try:
        response = device.status()
        dps = response.get("dps") if isinstance(response, dict) else None
        if not isinstance(dps, dict):
            raise RuntimeError("Device did not return DPS")
        return dps
    finally:
        device.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["capture", "diff"])
    parser.add_argument("--baseline", default="/tmp/osoji-dps-baseline.json")
    parser.add_argument("--config", default="/var/lib/homebridge/config.json")
    args = parser.parse_args()
    baseline = Path(args.baseline)
    current = capture(Path(args.config))
    if args.operation == "capture":
        baseline.write_text(json.dumps(current))
        baseline.chmod(0o600)
        print("Baseline guardado localmente; no se muestran credenciales ni DPS.")
    else:
        old = json.loads(baseline.read_text())
        changes = {k: (old.get(k, "ausente"), current.get(k, "ausente"))
                   for k in set(old) | set(current) if old.get(k) != current.get(k)}
        if not changes:
            print("No hubo cambios DPS visibles.")
        for key in sorted(changes, key=lambda value: (0, int(value)) if value.isdigit() else (1, value)):
            previous, now = changes[key]
            print(f"DP{key}: {previous} -> {now}")

if __name__ == "__main__":
    main()
