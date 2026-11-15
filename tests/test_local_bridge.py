import unittest
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("bridge", Path(__file__).resolve().parents[1] / "scripts" / "local_bridge.py")
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class FakeDevice:
    def __init__(self, *args, **kwargs):
        self.writes = []
    def set_socketTimeout(self, timeout): pass
    def status(self): return {"dps": {"3": "smart", "5": "charging_base", "6": 100}}
    def set_value(self, dp, value):
        self.writes.append((dp, value))
        return {"dps": {"3": value}}
    def close(self): pass

class LocalTests(unittest.TestCase):
    def setUp(self):
        self.device = FakeDevice()
        self.factory = lambda *a, **k: self.device
        self.req = {"deviceId": "test-id", "ip": "127.0.0.1", "localKey": "redacted", "version": "3.4"}
    def test_charging_is_not_cleaning(self):
        self.assertFalse(bridge.run({**self.req, "action": "status"}, self.factory)["cleaning"])
    def test_start_only_updates_mode(self):
        bridge.run({**self.req, "action": "start"}, self.factory)
        self.assertEqual(self.device.writes, [(3, "smart")])
    def test_dock_only_updates_mode(self):
        bridge.run({**self.req, "action": "dock"}, self.factory)
        self.assertEqual(self.device.writes, [(3, "chargego")])
    def test_no_arbitrary_commands(self):
        with self.assertRaises(ValueError):
            bridge.run({**self.req, "action": "reset"}, self.factory)

if __name__ == "__main__":
    unittest.main()
