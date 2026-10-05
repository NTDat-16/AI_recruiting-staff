import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
candidate_id = "8422b4ef-6a69-4e58-bcea-6519ccce89b7"

# 1. Get auth token
login_req = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/auth/login",
    data=json.dumps({"email": "demo.hr@recruiting.vn", "password": "Demo123456@"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(login_req) as resp:
    token = json.loads(resp.read().decode("utf-8"))["access_token"]

tests = [
    ("Backend without token", f"http://127.0.0.1:8000/api/v1/candidates/{candidate_id}", {}),
    ("Backend with token", f"http://127.0.0.1:8000/api/v1/candidates/{candidate_id}", {"Authorization": f"Bearer {token}"}),
    ("Frontend proxy without token", f"http://localhost:3000/api/v1/candidates/{candidate_id}", {}),
    ("Frontend proxy with token", f"http://localhost:3000/api/v1/candidates/{candidate_id}", {"Authorization": f"Bearer {token}"}),
]

for label, url, headers in tests:
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            name = data.get("full_name")
            apps = len(data.get("applications", []))
            print(f"[{label}] -> HTTP {resp.status} OK | Candidate: {name} | Applications: {apps}")
    except Exception as e:
        print(f"[{label}] -> ERROR: {e}")
