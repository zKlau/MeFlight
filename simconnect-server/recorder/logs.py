import logging
import sys
from recorder.paths import log_path

LOG_FORMAT = "%(asctime)s %(levelname)s %(name)s: %(message)s"
ENCODING = "utf-8"

def setup_logging() -> None:
    if sys.stdout is None or sys.stderr is None:
        log_file = open(log_path(), "a", encoding=ENCODING, buffering=1)
        sys.stdout = log_file
        sys.stderr = log_file
    logging.basicConfig(level=logging.WARNING, format=LOG_FORMAT, stream=sys.stderr)
