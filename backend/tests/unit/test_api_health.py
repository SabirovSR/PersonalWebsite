"""Tests for health check endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(test_client: AsyncClient):
    """Test basic health check endpoint."""
    response = await test_client.get("/api/health")
    
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_liveness_check(test_client: AsyncClient):
    """Test liveness probe endpoint."""
    response = await test_client.get("/api/health/live")
    
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_readiness_check_all_healthy(test_client: AsyncClient):
    """Test readiness probe when all services are healthy."""
    response = await test_client.get("/api/health/ready")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "ready"
    assert "checks" in data
    assert "redis" in data["checks"]
    assert "kafka" in data["checks"]


@pytest.mark.asyncio
async def test_startup_check(test_client: AsyncClient):
    """Test startup probe endpoint."""
    response = await test_client.get("/api/health/startup")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "status" in data
    assert "checks" in data
