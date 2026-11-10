import subprocess

cmd = [
    "wsl", "-d", "Ubuntu-22.04", "bash", "-c",
    "cd /mnt/c/Users/shiva/OneDrive/Desktop/Cloudnative && git add . && git commit -m 'feat(devops): production hardening, S3 automated backups, k6 load testing, rollback workflow, and devops architecture docs' && git push origin main"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
print(res.stdout)
if res.stderr:
    print("Stderr:", res.stderr)
