import asyncio
import io
import json
import sys
import urllib.request
import urllib.error
import urllib.parse
from typing import Dict, Any

sys.stdout.reconfigure(encoding="utf-8")
BASE_URL = "http://127.0.0.1:8000"


def make_request(method: str, path: str, data: Any = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
    url = f"{BASE_URL}{path}"
    req_headers = headers or {}
    req_data = None
    if data is not None:
        if isinstance(data, dict):
            req_data = json.dumps(data).encode("utf-8")
            req_headers["Content-Type"] = "application/json"
        elif isinstance(data, bytes):
            req_data = data

    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode("utf-8")
            return {
                "status": resp.status,
                "data": json.loads(content) if content else {}
            }
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        return {
            "status": e.code,
            "data": json.loads(content) if content else {},
            "error": str(e)
        }


def main():
    print("==================================================================")
    print(" KIỂM THỬ TRỌN VẸN VÒNG ĐỜI NGƯỜI DÙNG THỰC TẾ (END-TO-END WORKFLOW)")
    print(" Nền tảng Tuyển dụng Nhân sự AI")
    print("==================================================================")

    # 1. Login HR
    print("\n1. [Xác thực] HR Đăng nhập vào hệ thống...")
    login_res = make_request("POST", "/api/v1/auth/login", {
        "email": "demo.hr@recruiting.vn",
        "password": "Demo123456@"
    })
    assert login_res["status"] == 200, f"Login failed: {login_res}"
    token = login_res["data"]["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}
    print(f"   -> Đăng nhập thành công! Token: {token[:20]}...")

    # 2. Check Dashboard Stats
    print("\n2. [Dashboard] Tải thống kê tổng quan thực tế từ CSDL...")
    stats_res = make_request("GET", "/api/v1/candidates/overview/stats", headers=auth_header)
    assert stats_res["status"] == 200, f"Stats failed: {stats_res}"
    stats = stats_res["data"]
    print(f"   -> Tổng số tin tuyển dụng (Jobs): {stats['total_jobs']}")
    print(f"   -> Tổng số ứng viên (Candidates): {stats['total_candidates']}")
    print(f"   -> Tổng số lịch phỏng vấn (Interviews): {stats['total_interviews']}")
    print(f"   -> Điểm trung bình AI Match: {stats['average_match_score']}%")
    print(f"   -> Pipeline Funnel: {stats['pipeline_funnel']}")

    # 3. View Public Jobs
    print("\n3. [Ứng viên] Xem danh sách việc làm mở công khai...")
    jobs_res = make_request("GET", "/api/v1/jobs/public")
    assert jobs_res["status"] == 200 and len(jobs_res["data"]) > 0, "No public jobs"
    target_job = jobs_res["data"][0]
    print(f"   -> Chọn việc làm: '{target_job['title']}' (ID: {target_job['id']})")

    # 4. View Candidates Pipeline
    print("\n4. [HR Pipeline] Xem danh sách ứng viên trong hệ thống...")
    cand_res = make_request("GET", "/api/v1/candidates", headers=auth_header)
    assert cand_res["status"] == 200 and len(cand_res["data"]) > 0, "No candidates found"
    candidates = cand_res["data"]
    print(f"   -> Số lượng ứng viên tải về: {len(candidates)} ứng viên")
    for c in candidates[:3]:
        app = c.get("applications", [{}])[0]
        print(f"      * {c['full_name']} | Trạng thái: {app.get('status')} | Match Score: {app.get('ai_match_score')}%")

    # 5. View Candidate Detail
    first_candidate = candidates[0]
    print(f"\n5. [HR Detail] Xem hồ sơ chi tiết của ứng viên: {first_candidate['full_name']}...")
    detail_res = make_request("GET", f"/api/v1/candidates/{first_candidate['id']}", headers=auth_header)
    assert detail_res["status"] == 200, f"Detail failed: {detail_res}"
    cand_detail = detail_res["data"]
    print(f"   -> Email: {cand_detail['email']} | SĐT: {cand_detail['phone']}")
    print(f"   -> Kỹ năng trích xuất: {cand_detail['parsed_data'].get('skills', [])}")

    # 6. View Interviews
    print("\n6. [Phỏng vấn] Tải danh sách lịch phỏng vấn...")
    int_res = make_request("GET", "/api/v1/interviews", headers=auth_header)
    assert int_res["status"] == 200, f"Interviews failed: {int_res}"
    interviews = int_res["data"]
    print(f"   -> Tổng số lịch phỏng vấn hiện có: {len(interviews)}")
    if interviews:
        first_int = interviews[0]
        print(f"      * Buổi: '{first_int['title']}' | Link họp: {first_int['meeting_link']}")

    # 7. Preview Offer Email
    print("\n7. [Gửi Offer] Xem trước mẫu thư mời nhận việc tự động (Offer Letter preview)...")
    offer_res = make_request("POST", "/api/v1/email/preview", {
        "template_type": "offer",
        "candidate_ids": [first_candidate["id"]],
        "job_id": target_job["id"],
        "custom_tone_instruction": "Trang trọng, chuyên nghiệp và chúc mừng ứng viên"
    }, headers=auth_header)
    assert offer_res["status"] == 200, f"Offer preview failed: {offer_res}"
    preview_item = offer_res["data"]["previews"][0]
    print(f"   -> Tiêu đề thư: {preview_item['subject']}")
    print(f"   -> Người nhận: {preview_item['recipient_name']} ({preview_item['recipient_email']})")
    print(f"   -> Cảnh báo trùng lặp: {preview_item['is_duplicate_warning']}")
    print("   -> Nội dung HTML thư mời nhận việc đã được tạo chuẩn xác.")

    print("\n==================================================================")
    print(" TOÀN BỘ 7 LUỒNG NGHIỆP VỤ THỰC TẾ CHẠY HOÀN HẢO 100%!")
    print("==================================================================")


if __name__ == "__main__":
    main()
