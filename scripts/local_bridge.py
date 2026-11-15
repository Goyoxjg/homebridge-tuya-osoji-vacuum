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
    if action not in ("status", "start", "dock"):
        raise ValueError("Unsupported operation")
    device = factory(request["deviceId"], request["ip"], request["localKey"], version=float(request.get("version", 3.4)))
    device.set_socketTimeout(5)
    try:
        if action == "status":
            response = device.status()
        elif action == "start":
            # Verified on the OSOJI X420 over Tuya LAN 3.4: the three
            # datapoints must be sent together, not as individual writes.
            # The device reported DP5=smart_clean and physically started.
            response = device.set_multiple_values({1: True, 2: True, 3: "smart"})
        else:
            # Dock requires a separately supervised LAN test. Do not
            # assume the legacy Cloud sequence is safe for LAN.
            raise RuntimeError("Dock command not yet verified over LAN")
        if not isinstance(response, dict) or "Error" in response or "Err" in response:
            raise RuntimeError("Device returned an invalid/error response")
        if action == "status":
            dps = response.get("dps")
            if not isinstance(dps, dict):
                raise RuntimeError("Missing DPS response")
            return {"ok": True, "cleaning": dps.get("5") in CLEANING,
                    "status": str(dps.get("5", "unknown")),
                    "battery": dps.get("6")}
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
