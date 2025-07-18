"""
Pytest configuration and shared fixtures
"""

import pytest
from tests.utils.db_test_utils import db_session

# Make the db_session fixture available to all tests
__all__ = ["db_session"]
