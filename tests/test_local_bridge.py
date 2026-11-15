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
    def set_socketTimeout(self, timeout): pass
    def status(self): return {"dps": {"3": "smart", "5": "charging_base", "6": 100}}
    def set_multiple_values(self, values):
        self.writes.append(dict(values))
        return {"dps": {"3": values[3]}}
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
    def test_dock_is_blocked_until_verified(self):
        with self.assertRaisesRegex(RuntimeError, "not yet verified"):
            bridge.run({**self.req, "action": "dock"}, self.factory)
        self.assertEqual(self.device.writes, [])
        self.assertTrue(self.device.closed)
    def test_no_arbitrary_commands(self):
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "reset"}, self.factory)
    def test_none_write_response_is_rejected(self):
        self.device.set_multiple_values = lambda values: None
        with self.assertRaises(RuntimeError):
            bridge.run({**self.req, "action": "start"}, self.factory)

if __name__ == "__main__":
    unittest.main()
