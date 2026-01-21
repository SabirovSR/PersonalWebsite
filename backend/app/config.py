"""
Application configuration using pydantic-settings.
"""
from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    app_name: str = "PersonalWebsite API"
    environment: str = "production"  # production, development, staging
    debug: bool = False
    
    # API Security
    public_api_key: str = "change-me-in-production"
    
    # CORS Configuration (comma-separated string from env, converted to list)
    cors_origins: str = "https://sabirov.tech,https://web.sabirov.tech,http://localhost:3000,http://127.0.0.1:3000"
    cors_allow_credentials: bool = True
    cors_max_age: int = 3600  # 1 hour
    
    # Kafka (external KRaft cluster)
    kafka_bootstrap_servers: str = "kafka-controller-1:9092,kafka-controller-2:9092,kafka-controller-3:9092"
    kafka_topic: str = "sabirov-contact-requests"
    kafka_dlq_topic: str = "sabirov-contact-dlq"
    kafka_consumer_group: str = "contact-processor"
    
    # PostgreSQL
    postgres_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/contacts"
    
    # Redis Sentinel Configuration (comma-separated string from env, converted to list)
    redis_sentinel_hosts: str = "redis-sentinel-1:26379,redis-sentinel-2:26379,redis-sentinel-3:26379"
    redis_sentinel_master: str = "mymaster"
    redis_password: str = "$aveL1j+-"
    redis_db: int = 0
    redis_socket_timeout: float = 5.0
    redis_socket_connect_timeout: float = 5.0
    
    # Rate limiting
    rate_limit_requests: int = 5
    rate_limit_window_seconds: int = 3600  # 1 hour
    
    # Telegram
    telegram_bot_token: str = ""
    telegram_webhook_secret: str = "change-me-secret"
    telegram_owner_id: int = 0
    telegram_webhook_url: str = ""
    
    # Helper properties to get lists from comma-separated strings
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    @property
    def redis_sentinel_hosts_list(self) -> list[tuple[str, int]]:
        """Parse Redis Sentinel hosts from comma-separated string to list of (host, port) tuples."""
        hosts = []
        for host_port in self.redis_sentinel_hosts.split(","):
            host_port = host_port.strip()
            if ":" in host_port:
                host, port = host_port.rsplit(":", 1)
                hosts.append((host, int(port)))
            else:
                hosts.append((host_port, 26379))  # default sentinel port
        return hosts


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
