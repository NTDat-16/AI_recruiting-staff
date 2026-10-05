import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_job_posting_crud(client: AsyncClient):
    # 1. Login to get token
    reg_payload = {
        "email": "lead_recruiter@company.vn",
        "password": "Password123!",
        "full_name": "Nguyen Lead",
        "company_name": "AI Solutions",
        "role": "hr",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "lead_recruiter@company.vn", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Job Posting
    job_payload = {
        "title": "Backend Python AI Developer",
        "department": "Engineering",
        "location": "Hà Nội",
        "salary_range": "35-50M",
        "description": "Xây dựng hệ thống tuyển dụng AI",
        "requirements": "3+ năm Python, FastAPI, Docker",
        "ai_criteria_weights": {
            "required_skills": 0.4,
            "experience_years": 0.3,
            "education": 0.15,
            "domain_knowledge": 0.15,
        },
    }
    create_res = await client.post("/api/v1/jobs", json=job_payload, headers=headers)
    assert create_res.status_code == 201
    job_data = create_res.json()
    assert job_data["title"] == "Backend Python AI Developer"
    assert job_data["status"] == "draft"
    job_id = job_data["id"]

    # 3. Publish Job
    pub_res = await client.post(f"/api/v1/jobs/{job_id}/publish", headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    # 4. Check Public Endpoint
    slug = job_data["slug"]
    public_res = await client.get(f"/api/v1/jobs/public/{slug}")
    assert public_res.status_code == 200
    assert public_res.json()["title"] == "Backend Python AI Developer"
