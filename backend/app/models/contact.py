"""
Contact form models.
"""

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class ContactChannel(str, Enum):
    """Available contact channels."""

    EMAIL = "email"
    TELEGRAM = "telegram"
    VK = "vk"  # VK Social Network
    PHONE = "phone"
    WEBSITE = "website"
    MAX = "max"  # MAX Messenger
    WHATSAPP = "whatsapp"  # Deprecated, keep for backwards compatibility


class FormSource(str, Enum):
    """Where the contact form was submitted."""

    HOME = "home"
    BUSINESS = "business"


class ContactTariff(str, Enum):
    """Selected service tier (business page)."""

    BASIC = "basic"
    ADVANCED = "advanced"
    INFRA = "infra"
    CUSTOM = "custom"
    UNSURE = "unsure"


class ContactInfo(BaseModel):
    """Contact information for different channels."""

    email: EmailStr | None = None
    telegram: str | None = Field(None, max_length=100)
    vk: str | None = Field(None, max_length=100)  # VK profile
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=200)
    max: str | None = Field(None, max_length=100)  # MAX ID
    whatsapp: str | None = Field(None, max_length=20)

    @field_validator("telegram")
    @classmethod
    def validate_telegram(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        # Remove @ if present for storage
        if v.startswith("@"):
            v = v[1:]
        return v

    @field_validator("phone", "whatsapp")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
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
    form_source: FormSource = FormSource.HOME
    tariff: ContactTariff | None = None

    @field_validator("name", "message")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()

    @model_validator(mode="after")
    def normalize_tariff_for_source(self) -> "ContactFormRequest":
        if self.form_source == FormSource.HOME:
            return self.model_copy(update={"tariff": None})
        if self.tariff is None:
            raise ValueError("tariff is required when form_source is business")
        return self


class ContactMessage(BaseModel):
    """Message model for Kafka queue."""

    id: UUID = Field(default_factory=uuid4)
    name: str
    message: str
    channels: list[ContactChannel]
    contacts: ContactInfo
    form_source: FormSource = FormSource.HOME
    tariff: ContactTariff | None = None
    ip_address: str | None = None
    user_agent: str | None = None
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
    id: UUID | None = None
