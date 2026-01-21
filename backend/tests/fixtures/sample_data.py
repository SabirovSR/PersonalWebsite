"""Sample data for tests."""
from app.models import ContactChannels, ContactFormRequest, Contacts


def get_sample_contact_request() -> dict:
    """Get a sample contact form request."""
    return {
        "name": "John Doe",
        "message": "Hello! I would like to discuss a project.",
        "channels": ["telegram", "email"],
        "contacts": {
            "telegram": "@johndoe",
            "email": "john@example.com",
        },
    }


def get_sample_contact_model() -> ContactFormRequest:
    """Get a sample ContactFormRequest model."""
    return ContactFormRequest(
        name="John Doe",
        message="Hello! I would like to discuss a project.",
        channels=[ContactChannels.telegram, ContactChannels.email],
        contacts=Contacts(
            telegram="@johndoe",
            email="john@example.com",
        ),
    )
