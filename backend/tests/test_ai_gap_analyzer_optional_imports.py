import builtins
import importlib
import sys
import types
import unittest
from unittest.mock import patch


class OptionalGeminiImportTests(unittest.TestCase):
    def test_ai_gap_analyzer_imports_without_google_package(self):
        sys.modules.pop("app.dsa.ai_gap_analyzer", None)
        sys.modules.pop("google", None)
        sys.modules.pop("google.generativeai", None)

        real_import = builtins.__import__

        fake_pypdf = types.ModuleType("pypdf")
        fake_pypdf.PdfReader = object
        sys.modules["pypdf"] = fake_pypdf

        def fake_import(name, globals=None, locals=None, fromlist=(), level=0):
            if name == "google" or name == "google.generativeai":
                raise ModuleNotFoundError("No module named 'google'")
            return real_import(name, globals, locals, fromlist, level)

        with patch("builtins.__import__", side_effect=fake_import):
            module = importlib.import_module("app.dsa.ai_gap_analyzer")

        self.assertIsNone(module.gemini_model)


if __name__ == "__main__":
    unittest.main()
