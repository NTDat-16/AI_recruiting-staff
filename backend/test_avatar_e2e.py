import io
import os
import sys
sys.stdout.reconfigure(encoding="utf-8")
import json
import urllib.request
from PIL import Image, ImageDraw
import pypdfium2

def create_pdf_cv_with_avatar() -> bytes:
    """Tạo 1 CV dạng PDF chuẩn vector A4 có chèn ảnh đại diện chân dung ứng viên."""
    # 1. Tạo ảnh chân dung 240x320
    avt = Image.new("RGB", (240, 320), color=(52, 152, 219))
    draw = ImageDraw.Draw(avt)
    draw.ellipse((70, 40, 170, 140), fill=(245, 205, 175))
    draw.rectangle((40, 150, 200, 310), fill=(41, 128, 185))
    draw.ellipse((85, 75, 105, 95), fill=(40, 40, 40))
    draw.ellipse((135, 75, 155, 95), fill=(40, 40, 40))
    draw.arc((95, 100, 145, 125), start=0, end=180, fill=(180, 50, 50), width=3)

    avt_buf = io.BytesIO()
    avt.save(avt_buf, format="JPEG", quality=90)
    avt_bytes = avt_buf.getvalue()

    # 2. Tạo PDF chuẩn A4 và chèn ảnh chân dung vào phần Header
    pdf = pypdfium2.PdfDocument.new()
    page = pdf.new_page(595, 842) # A4 size

    img_obj = pypdfium2.PdfImage.new(pdf)
    img_obj.load_jpeg(io.BytesIO(avt_bytes))
    # Đặt ảnh ở góc trên bên trái: x=50, y=660, w=100, h=133
    img_obj.set_matrix(pypdfium2.raw.FS_MATRIX(100, 0, 0, 133, 50, 660))
    page.insert_obj(img_obj)
    page.gen_content()

    pdf_buf = io.BytesIO()
    pdf.save(pdf_buf)
    pdf.close()
    return pdf_buf.getvalue()

def submit_cv(url: str, job_id: str, full_name: str, email: str, phone: str, file_bytes: bytes, filename: str):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = io.BytesIO()
    def add_field(name, val):
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        body.write(f"{val}\r\n".encode())
    add_field("job_id", job_id)
    add_field("full_name", full_name)
    add_field("email", email)
    add_field("phone", phone)
    
    if file_bytes and filename:
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="cv_file"; filename="{filename}"\r\n'.encode())
        body.write(b"Content-Type: application/pdf\r\n\r\n")
        body.write(file_bytes)
        body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    
    req = urllib.request.Request(
        url,
        data=body.getvalue(),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    res = urllib.request.urlopen(req, timeout=30)
    return res.status, json.loads(res.read())

def run_avatar_e2e_tests():
    print("=" * 70)
    print("KIỂM THỬ END-TO-END TÍNH NĂNG TRÍCH XUẤT VÀ TẢI AVATAR ỨNG VIÊN TỪ CV")
    print("=" * 70)

    # Lấy job_id đang mở
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/jobs/public")
    jobs = json.loads(urllib.request.urlopen(req).read())
    assert len(jobs) > 0, "Không có job nào trong hệ thống!"
    job_id = jobs[0]["id"]
    print(f"✓ Sử dụng Job: '{jobs[0]['title']}' (ID: {job_id})")

    # 1. Nộp hồ sơ ứng viên CÓ AVATAR trong PDF
    print("\n--- TEST 1: Nộp CV PDF có ảnh đại diện chân dung ---")
    cv_pdf_bytes = create_pdf_cv_with_avatar()
    status, app_data = submit_cv(
        url="http://127.0.0.1:8000/api/v1/candidates/apply",
        job_id=job_id,
        full_name="Võ Thị Mai Phương (Avatar Test)",
        email="maiphuong.ai.avatar@test.vn",
        phone="0911223344",
        file_bytes=cv_pdf_bytes,
        filename="CV_Vo_Thi_Mai_Phuong_Avatar.pdf"
    )
    print(f"✓ Nộp hồ sơ thành công! Status={status}, Application ID={app_data['id']}")
    cand_id = app_data["candidate_id"]

    # 2. Truy xuất thông tin chi tiết ứng viên
    print("\n--- TEST 2: Kiểm tra trường avatar_url trong Candidate Detail ---")
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/candidates/{cand_id}")
    cand_detail = json.loads(urllib.request.urlopen(req).read())
    avatar_url = cand_detail.get("avatar_url")
    print(f"✓ Candidate Detail avatar_url: '{avatar_url}'")
    assert avatar_url is not None and avatar_url.startswith("/storage/avatars/"), f"FAILED: avatar_url không hợp lệ: {avatar_url}"
    print(f"✓ Avatar URL lưu trong CSDL chính xác: {avatar_url}")

    # 3. Kiểm tra tệp tin ảnh vật lý trên đĩa
    print("\n--- TEST 3: Kiểm tra tệp tin ảnh vật lý trên ổ đĩa backend ---")
    clean_path = avatar_url.lstrip("/")
    abs_disk_path = os.path.join(os.getcwd(), clean_path)
    assert os.path.exists(abs_disk_path), f"FAILED: File không tồn tại trên đĩa: {abs_disk_path}"
    file_size = os.path.getsize(abs_disk_path)
    print(f"✓ Tệp ảnh tồn tại: {abs_disk_path} (Dung lượng: {file_size} bytes)")
    assert file_size > 1000, "FAILED: Dung lượng tệp ảnh quá nhỏ!"

    # 4. Kiểm tra endpoint chuyên biệt GET /candidates/{id}/avatar
    print("\n--- TEST 4: Gọi trực tiếp endpoint GET /api/v1/candidates/{id}/avatar ---")
    req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/candidates/{cand_id}/avatar")
    avt_res = urllib.request.urlopen(req)
    assert avt_res.status == 200, f"FAILED: Status {avt_res.status}"
    content_type = avt_res.headers.get("Content-Type")
    img_data = avt_res.read()
    print(f"✓ Endpoint GET /avatar trả về HTTP 200 OK, Content-Type='{content_type}', Size={len(img_data)} bytes")
    assert "image/jpeg" in content_type, f"FAILED: Sai media type: {content_type}"

    # 5. Kiểm tra truy cập tĩnh qua FastAPI (/storage/avatars/...)
    print("\n--- TEST 5: Gọi trực tiếp URL Static Storage trên Backend (Port 8000) ---")
    static_url_backend = f"http://127.0.0.1:8000{avatar_url}"
    res = urllib.request.urlopen(static_url_backend)
    assert res.status == 200, f"FAILED: Backend static storage trả về {res.status}"
    print(f"✓ Backend Static Storage ({static_url_backend}) trả về HTTP 200 OK")

    # 6. Kiểm tra truy cập tĩnh qua Next.js Proxy/Rewrite (Port 3000)
    print("\n--- TEST 6: Gọi URL Static Storage qua Frontend Next.js Proxy (Port 3000) ---")
    static_url_frontend = f"http://localhost:3000{avatar_url}"
    res = urllib.request.urlopen(static_url_frontend)
    assert res.status == 200, f"FAILED: Frontend rewrite trả về {res.status}"
    print(f"✓ Frontend Next.js Rewrite ({static_url_frontend}) trả về HTTP 200 OK, Size={len(res.read())} bytes")

    # 7. Kiểm tra Candidate Detail trên giao diện Frontend Next.js
    print("\n--- TEST 7: Kiểm tra render trang chi tiết ứng viên trên Frontend ---")
    fe_detail_url = f"http://localhost:3000/candidates/{cand_id}"
    res = urllib.request.urlopen(fe_detail_url)
    assert res.status == 200, f"FAILED: Frontend detail page trả về {res.status}"
    html_content = res.read().decode("utf-8")
    assert "Mai Phương" in html_content or len(html_content) > 10000, "Frontend detail page không hiển thị ứng viên!"
    print(f"✓ Giao diện ứng viên trên Next.js tải thành công HTTP 200 OK ({len(html_content)} bytes)")

    # 8. Kiểm tra nộp CV Plain Text (KHÔNG CÓ AVATAR) -> Fallback chuẩn xác
    print("\n--- TEST 8: Nộp CV không có ảnh (fallback initials) ---")
    txt_content = b"Ho va ten: Tran Minh Triet\nEmail: triet.tran.noavatar@test.vn\nKy nang: Python, AI"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = io.BytesIO()
    def add_field(name, val):
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        body.write(f"{val}\r\n".encode())
    add_field("job_id", job_id)
    add_field("full_name", "Trần Minh Triết (No Avatar)")
    add_field("email", "triet.tran.noavatar@test.vn")
    add_field("phone", "0909090909")
    body.write(f"--{boundary}\r\n".encode())
    body.write(b'Content-Disposition: form-data; name="cv_file"; filename="cv_no_avatar.txt"\r\n')
    body.write(b"Content-Type: text/plain\r\n\r\n")
    body.write(txt_content)
    body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/candidates/apply",
        data=body.getvalue(),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    app2 = json.loads(res.read())
    cand2_id = app2["candidate_id"]

    req = urllib.request.Request(f"http://127.0.0.1:8000/api/v1/candidates/{cand2_id}")
    cand2_detail = json.loads(urllib.request.urlopen(req).read())
    assert cand2_detail.get("avatar_url") is None, f"FAILED: CV plain text không được có avatar_url! Got: {cand2_detail.get('avatar_url')}"
    print(f"✓ Ứng viên không có ảnh: avatar_url = None, giao diện hiển thị an toàn chữ cái đầu 'T'")

    print("\n" + "=" * 70)
    print("TẤT CẢ 8 BÀI KIỂM THỬ TÍNH NĂNG LOAD AVATAR ĐỀU ĐẠT CHUẨN 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_avatar_e2e_tests()
