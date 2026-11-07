import os
import zipfile
import hashlib
import base64
import json
import requests

def upload():
    # 1. Read step output to get exact presigned upload data
    step_output_path = r"C:/Users/gabri/.gemini/antigravity/brain/739f1de0-9e13-448b-a6db-bb2827f81d2b/.system_generated/steps/1107/output.txt"
    with open(step_output_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    upload_info = data["upload"]
    submit_url = upload_info["submitUrl"]
    fields = upload_info["fields"]
    
    # 2. Create zip archive with index.html at root
    proto_html_path = os.path.abspath("cinefood/docs/prototipo/index.html")
    archive_path = os.path.abspath("cinefood/scripts/prototype_upload.zip")
    
    with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(proto_html_path, arcname="index.html")
    
    print(f"Created zip archive at: {archive_path} ({os.path.getsize(archive_path)} bytes)")

    # 3. Calculate SHA256 base64
    with open(archive_path, "rb") as f:
        archive_bytes = f.read()

    hasher = hashlib.sha256(archive_bytes)
    checksum_b64 = base64.b64encode(hasher.digest()).decode("utf-8")
    print(f"SHA-256 Base64 Checksum: {checksum_b64}")

    # 4. Prepare multipart form data in exact order
    # Note: AWS S3 presigned post requires form fields before the file field
    form_data = dict(fields)
    form_data["Content-Type"] = "application/octet-stream"
    form_data["x-amz-checksum-sha256"] = checksum_b64

    files = {
        "file": ("archive.zip", archive_bytes, "application/octet-stream")
    }

    print(f"Sending POST to {submit_url} ...")
    resp = requests.post(submit_url, data=form_data, files=files)
    print(f"Response status: {resp.status_code}")
    if resp.status_code in [200, 204]:
        print("Upload succeeded!")
    else:
        print("Upload failed:", resp.text)

if __name__ == "__main__":
    upload()
