"""One-time (idempotent) Clerk provisioning for Interview Coach.

Run: cd /app/backend && python provision_clerk.py
The platform writes CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY into backend/.env
and restarts the backend; this script never sees the secret key.
"""

import json
import os
import time
import urllib.error
import urllib.request

base = os.environ["INTEGRATION_PROXY_URL"]
job_id = "3bf69d5c-e7c3-460a-b344-ea176f556af5"
key = "sk-emergent-d8115861e097d11111"
body = json.dumps({
    "sign_in": ["email", "google"],
    "app_name": "Interview Coach",
}).encode()
for attempt in range(3):
    req = urllib.request.Request(
        base + "/api/v1/clerk/jobs/" + job_id + "/app",
        data=body,
        method="POST",
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
    )
    try:
        print(json.load(urllib.request.urlopen(req, timeout=120)))
        break
    except urllib.error.HTTPError as e:
        if e.code != 409 or attempt == 2:
            raise SystemExit(f"Clerk setup failed: {e.code} {e.read().decode()[:300]}")
        time.sleep(15)
