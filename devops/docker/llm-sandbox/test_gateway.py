import json
import unittest
from gateway import MAX_OUTPUT, MAX_SOURCE, bounded_text, validate_payload


class ValidationTests(unittest.TestCase):
    def test_strict_shape_and_language(self):
        self.assertEqual(validate_payload({"language": "python", "source": "print(1)"})[0], "python")
        for value in ({"language": "ruby", "source": "x"}, {"language": "python", "source": "x", "extra": 1}):
            with self.assertRaises(ValueError): validate_payload(value)
        with self.assertRaises(ValueError): validate_payload({"language": "java", "source": "x"})

    def test_byte_limit(self):
        with self.assertRaises(ValueError): validate_payload({"language": "python", "source": "é" * MAX_SOURCE})

    def test_output_budget_is_aggregate(self):
        stdout = bounded_text("é" * MAX_OUTPUT, MAX_OUTPUT)
        stderr = bounded_text("error", MAX_OUTPUT - len(stdout.encode()))
        self.assertLessEqual(len(stdout.encode()) + len(stderr.encode()), MAX_OUTPUT)


if __name__ == "__main__":
    unittest.main()
