import unittest
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("bridge", Path(__file__).resolve().parents[1] / "scripts" / "local_bridge.py")
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class FakeDevice:
    def __init__(self, *args, **kwargs):
        self.writes = []
        self.closed = False
        self.phase = "charging_base"
        self.suction = "normal"
        self.mode = "smart"
    def set_socketTimeout(self, timeout): pass
    def status(self): return {"dps": {"3": self.mode, "5": self.phase, "6": 100, "14": self.suction}}
    def set_multiple_values(self, values):
        self.writes.append(dict(values))
        self.mode = values[3]
        return {"dps": {"3": values[3]}}
    def set_value(self, dp, value):
        self.writes.append((dp, value))
        if dp == 14:
            self.suction = value
        return {"dps": {str(dp): value}}
    def close(self): self.closed = True

class LocalTests(unittest.TestCase):
    def setUp(self):
        self.device = FakeDevice()
        self.factory = lambda *a, **k: self.device
        self.req = {"deviceId": "test-id", "ip": "127.0.0.1", "localKey": "redacted", "version": "3.4"}
    def test_charging_is_not_cleaning(self):
        self.assertFalse(bridge.run({**self.req, "action": "status"}, self.factory)["cleaning"])
    def test_start_uses_verified_atomic_scene(self):
        result = bridge.run({**self.req, "action": "start"}, self.factory)
        self.assertEqual(self.device.writes, [{1: True, 2: True, 3: "smart"}])
        self.assertTrue(result["ok"])
    def test_dock_uses_verified_atomic_scene(self):
        result = bridge.run({**self.req, "action": "dock"}, self.factory)
        self.assertEqual(self.device.writes, [{1: True, 2: False, 3: "chargego"}])
        self.assertTrue(result["ok"])
        self.assertTrue(self.device.closed)
    def test_get_suction_from_status(self):
        self.assertEqual(bridge.run({**self.req, "action": "status"}, self.factory)["suction"], "normal")
    def test_set_suction_only_while_cleaning(self):
        self.device.phase = "smart_clean"
        result = bridge.run({**self.req, "action": "set_suction", "suction": "strong"}, self.factory)
        self.assertEqual(self.device.writes, [(14, "strong")])
        self.assertEqual(result["suction"], "strong")
    def test_set_suction_rejected_when_docked(self):
        with self.assertRaisesRegex(RuntimeError, "not cleaning"):
            bridge.run({**self.req, "action": "set_suction", "suction": "strong"}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_set_suction_rejects_unrecognized_level(self):
        self.device.phase = "smart_clean"
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "set_suction", "suction": "turbo"}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_set_suction_requires_readback_confirmation(self):
        self.device.phase = "smart_clean"
        self.device.set_value = lambda dp, value: {"dps": {str(dp): value}}
        with self.assertRaisesRegex(RuntimeError, "not confirmed"):
            bridge.run({**self.req, "action": "set_suction", "suction": "strong"}, self.factory)
    def test_status_reports_mode(self):
        self.assertEqual(bridge.run({**self.req, "action": "status"}, self.factory)["mode"], "smart")
    def test_modes_disabled_by_default(self):
        self.device.phase = "smart_clean"
        with self.assertRaisesRegex(RuntimeError, "disabled"):
            bridge.run({**self.req, "action": "set_mode", "mode": "random"}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_mode_invalid_value_rejected(self):
        self.device.phase = "smart_clean"
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "set_mode", "mode": "chargego", "allowExperimentalModes": True}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_mode_blocked_when_docked(self):
        with self.assertRaisesRegex(RuntimeError, "active cleaning"):
            bridge.run({**self.req, "action": "set_mode", "mode": "random", "allowExperimentalModes": True}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_experimental_mode_sequence_and_readback(self):
        self.device.phase = "smart_clean"
        result = bridge.run({**self.req, "action": "set_mode", "mode": "random", "allowExperimentalModes": True}, self.factory)
        self.assertEqual(result["mode"], "random")
        self.assertEqual(self.device.writes, [{1: True, 2: True, 3: "random"}])
    def test_mode_noop_does_not_send_command(self):
        self.device.phase = "smart_clean"
        bridge.run({**self.req, "action": "set_mode", "mode": "smart", "allowExperimentalModes": True}, self.factory)
        self.assertEqual(self.device.writes, [])
    def test_mode_requires_readback(self):
        self.device.phase = "smart_clean"
        self.device.set_multiple_values = lambda values: {"dps": {"3": values[3]}}
        with self.assertRaisesRegex(RuntimeError, "not confirmed"):
            bridge.run({**self.req, "action": "set_mode", "mode": "spiral", "allowExperimentalModes": True}, self.factory)
    def test_no_arbitrary_commands(self):
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "reset"}, self.factory)
    def test_none_write_response_is_rejected(self):
        self.device.set_multiple_values = lambda values: None
        with self.assertRaises(RuntimeError):
            bridge.run({**self.req, "action": "start"}, self.factory)

if __name__ == "__main__":
    unittest.main()
