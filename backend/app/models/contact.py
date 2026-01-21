"""
Contact form models.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactChannel(str, Enum):
    """Available contact channels."""
    EMAIL = "email"
    TELEGRAM = "telegram"
    VK = "vk"  # VK Social Network
    PHONE = "phone"
    WEBSITE = "website"
    MAX = "max"  # MAX Messenger
    WHATSAPP = "whatsapp"  # Deprecated, keep for backwards compatibility


class ContactInfo(BaseModel):
    """Contact information for different channels."""
    email: Optional[EmailStr] = None
    telegram: Optional[str] = Field(None, max_length=100)
    vk: Optional[str] = Field(None, max_length=100)  # VK profile
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=200)
    max: Optional[str] = Field(None, max_length=100)  # MAX ID
    whatsapp: Optional[str] = Field(None, max_length=20)
    
    @field_validator("telegram")
    @classmethod
    def validate_telegram(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        # Remove @ if present for storage
        if v.startswith("@"):
            v = v[1:]
        return v
    
    @field_validator("phone", "whatsapp")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # Remove all non-digit characters except +
        cleaned = "".join(c for c in v if c.isdigit() or c == "+")
        return cleaned


class ContactFormRequest(BaseModel):
    """Request model for contact form submission."""
    name: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=5000)
    channels: list[ContactChannel] = Field(..., min_length=1)
    contacts: ContactInfo
    
    @field_validator("name", "message")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class ContactMessage(BaseModel):
    """Message model for Kafka queue."""
    id: UUID = Field(default_factory=uuid4)
    name: str
    message: str
    channels: list[ContactChannel]
    contacts: ContactInfo
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        }


class ContactResponse(BaseModel):
    """Response model for contact form submission."""
    status: str
    message: str
    id: Optional[UUID] = None
