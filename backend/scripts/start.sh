#!/bin/sh
set -e

python scripts/prepare_database.py

exec fastapi run main.py --host 0.0.0.0 --port "${PORT:-8000}"
