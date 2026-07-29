import importlib
import sys
import unittest


class MainImportTests(unittest.TestCase):
    def test_main_imports_without_optional_rag_dependencies(self):
        sys.modules.pop("app.main", None)
        module = importlib.import_module("app.main")
        self.assertTrue(hasattr(module, "app"))


if __name__ == "__main__":
    unittest.main()
