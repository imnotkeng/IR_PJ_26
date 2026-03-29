"""
Pytest configuration for the entire test suite.
This file should be in the tests/ directory.
"""

import sys
import os

# Add parent directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))