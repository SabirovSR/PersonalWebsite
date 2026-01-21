"""
Database module.
"""

from .models import ContactRecord
from .service import DatabaseService

__all__ = ["DatabaseService", "ContactRecord"]
