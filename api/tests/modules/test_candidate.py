import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_candidate_apply_and_ai_matching(client: AsyncClient):
    # 1. Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "hr_lead@company.vn",
            "password": "Password123!",
            "full_name": "Nguyen HR Lead",
            "company_name": "Innovation Lab",
            "role": "hr",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "hr_lead@company.vn", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    company_id = login_res.json()["company_id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Job (Default Status: Draft)
    job_res = await client.post(
        "/api/v1/jobs",
        json={
            "title": "Fullstack AI Engineer",
            "description": "Phát triển AI Web Platform",
            "requirements": "FastAPI, React, TypeScript, Next.js",
        },
        headers=headers,
    )
    job_id = job_res.json()["id"]

    # 3. Verify Draft Job Rejects Candidate Application (Requirement 2)
    draft_apply = await client.post(
        "/api/v1/candidates/apply",
        data={
            "job_id": job_id,
            "company_id": company_id,
            "full_name": "Pham Van AI",
            "email": "phamvana@gmail.com",
            "phone": "0988776655",
        },
    )
    assert draft_apply.status_code == 400
    assert "không mở nhận hồ sơ" in draft_apply.json().get("detail", "")

    # 4. Publish Job
    pub_res = await client.post(f"/api/v1/jobs/{job_id}/publish", headers=headers)
    assert pub_res.status_code == 200

    # 5. Candidate Apply Successfully to Published Job
    apply_res = await client.post(
        "/api/v1/candidates/apply",
        data={
            "job_id": job_id,
            "company_id": company_id,
            "full_name": "Pham Van AI",
            "email": "phamvana@gmail.com",
            "phone": "0988776655",
        },
    )
    assert apply_res.status_code == 201
    app_data = apply_res.json()
    assert app_data["match_score"] is not None
    assert app_data["score_breakdown"] is not None
    application_id = app_data["id"]

    # 4. Pipeline Status Update
    update_res = await client.patch(
        f"/api/v1/candidates/applications/{application_id}/pipeline-status",
        json={"status": "interview_invited", "hr_notes": "Ứng viên tiềm năng cao"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "interview_invited"

    # 5. Human-in-the-loop: HR Feedback on AI accuracy
    fb_res = await client.post(
        f"/api/v1/candidates/applications/{application_id}/score-feedback",
        json={"accuracy_rating": 5, "comment": "Điểm số và đánh giá rất sát với kinh nghiệm thực tế của ứng viên."},
        headers=headers,
    )
    assert fb_res.status_code == 200
    assert fb_res.json()["hr_feedback"]["accuracy_rating"] == 5
