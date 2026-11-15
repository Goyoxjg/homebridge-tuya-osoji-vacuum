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
    def set_socketTimeout(self, timeout): pass
    def status(self): return {"dps": {"3": "smart", "5": self.phase, "6": 100, "14": self.suction}}
    def set_multiple_values(self, values):
        self.writes.append(dict(values))
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
    def test_no_arbitrary_commands(self):
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "reset"}, self.factory)
    def test_none_write_response_is_rejected(self):
        self.device.set_multiple_values = lambda values: None
        with self.assertRaises(RuntimeError):
            bridge.run({**self.req, "action": "start"}, self.factory)

if __name__ == "__main__":
    unittest.main()
