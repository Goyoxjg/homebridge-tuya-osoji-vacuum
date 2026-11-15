#!/usr/bin/env python3
"""One-shot, local-only TinyTuya transport. Request/response JSON over stdin/stdout."""
import json
import sys

CLEANING = {"cleaning", "smart_clean", "spot_clean", "wall_clean", "mop_clean"}

def run(request, factory=None):
    if factory is None:
        import tinytuya
        factory = tinytuya.Device
    action = request.get("action")
    if action not in ("status", "start", "dock", "set_suction"):
        raise ValueError("Unsupported operation")
    device = factory(request["deviceId"], request["ip"], request["localKey"], version=float(request.get("version", 3.4)))
    device.set_socketTimeout(5)
    try:
        if action == "status":
            response = device.status()
        elif action == "set_suction":
            target = request.get("suction")
            if target not in ("normal", "strong"):
                raise ValueError("Unsupported suction level")
            prior = device.status()
            prior_dps = prior.get("dps") if isinstance(prior, dict) else None
            if not isinstance(prior_dps, dict) or prior_dps.get("5") not in CLEANING:
                raise RuntimeError("Cannot change suction while vacuum is not cleaning")
            response = device.set_value(14, target)
            if not isinstance(response, dict) or "Error" in response or "Err" in response:
                raise RuntimeError("Device returned an invalid/error response")
            observed = device.status()
            after_dps = observed.get("dps") if isinstance(observed, dict) else None
            if not isinstance(after_dps, dict) or after_dps.get("14") != target:
                raise RuntimeError("Suction change not confirmed by device state")
            return {"ok": True, "suction": target}
        elif action == "start":
            # Verified on the OSOJI X420 over Tuya LAN 3.4: the three
            # datapoints must be sent together, not as individual writes.
            # The device reported DP5=smart_clean and physically started.
            response = device.set_multiple_values({1: True, 2: True, 3: "smart"})
        else:
            # Verified physically on the OSOJI X420: stops cleaning and
            # navigates back to the charging base via Tuya LAN 3.4.
            response = device.set_multiple_values({1: True, 2: False, 3: "chargego"})
        if not isinstance(response, dict) or "Error" in response or "Err" in response:
            raise RuntimeError("Device returned an invalid/error response")
        if action == "status":
            dps = response.get("dps")
            if not isinstance(dps, dict):
                raise RuntimeError("Missing DPS response")
            return {"ok": True, "cleaning": dps.get("5") in CLEANING,
                    "status": str(dps.get("5", "unknown")),
                    "battery": dps.get("6"),
                    "suction": dps.get("14") if dps.get("14") in ("normal", "strong") else None}
        return {"ok": True}
    finally:
        device.close()

def main():
    try:
        request = json.loads(sys.stdin.read())
        result = run(request)
        print(json.dumps(result))
    except Exception as exc:
        # No stack trace or request dump: the input contains the Local Key.
        print(json.dumps({"ok": False, "error": type(exc).__name__}), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
