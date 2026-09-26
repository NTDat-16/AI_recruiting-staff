import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_auth_flow(client: AsyncClient):
    # Register
    reg_payload = {
        "email": "hr_manager@company.vn",
        "password": "Password123!",
        "full_name": "Tran Thi HR",
        "company_name": "Tech Corp Vietnam",
        "role": "hr",
        "department": "Human Resources",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "hr_manager@company.vn"
    assert user_data["role"] == "hr"

    # Login
    login_payload = {
        "email": "hr_manager@company.vn",
        "password": "Password123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Me
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "hr_manager@company.vn"
