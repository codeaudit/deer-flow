"""
SQLAlchemy declarative base configuration
"""

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase
from typing import Any


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""

    def __init__(self, *args: Any, **kwargs: Any):
        """Initialize the model with the given arguments"""
        for key, value in kwargs.items():
            setattr(self, key, value)
