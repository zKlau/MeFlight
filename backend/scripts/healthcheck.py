import os
import sys
import urllib.request

DEFAULT_PORT = "8000"
TIMEOUT_SECONDS = 3
HEALTHY_STATUS = 200

def main() -> int:
    url = f"http://127.0.0.1:{os.getenv('PORT', DEFAULT_PORT)}/"
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:
            return 0 if response.status == HEALTHY_STATUS else 1
    except OSError:
        return 1

if __name__ == "__main__":
    sys.exit(main())
