import urllib.request
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 1. Login
data = json.dumps({'email': 'demo.hr@recruiting.vn', 'password': 'Demo123456@'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/json'})
token = json.loads(urllib.request.urlopen(req).read())['access_token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# 2. Get interviews
req = urllib.request.Request('http://localhost:8000/api/v1/interviews', headers=headers)
interviews = json.loads(urllib.request.urlopen(req).read())
print(f'Total interviews: {len(interviews)}')

if interviews:
    iv = interviews[0]
    iv_id = iv['id']
    print(f"Testing with interview {iv_id}: Meeting link = {iv.get('meeting_link')}")

    # Test re-send invitation email
    req_email = urllib.request.Request(
        f'http://localhost:8000/api/v1/interviews/{iv_id}/send-invitation-email',
        data=b'{}',
        headers=headers
    )
    email_res = json.loads(urllib.request.urlopen(req_email).read())
    print("Send Invitation Email Response:", email_res)

    # Test AI classify decline email
    decline_email = 'Chào Ban Tuyển Dụng, cảm ơn quý công ty đã gửi thư mời phỏng vấn. Tuy nhiên tôi xin phép từ chối tham gia vì vừa qua tôi đã đồng ý nhận việc tại một công ty khác gần nhà hơn. Chúc công ty sớm tìm được ứng viên phù hợp.'
    req_classify = urllib.request.Request(
        f'http://localhost:8000/api/v1/interviews/{iv_id}/classify-email-response',
        data=json.dumps({'email_content': decline_email, 'auto_apply': True}).encode(),
        headers=headers
    )
    classify_res = json.loads(urllib.request.urlopen(req_classify).read())
    print("\nAI Classification Result (Decline):")
    print(json.dumps(classify_res, ensure_ascii=False, indent=2))
