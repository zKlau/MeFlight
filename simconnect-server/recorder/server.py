import threading
import time
import uvicorn
from fastapi import FastAPI

LOG_LEVEL = "warning"
STARTUP_POLL_SECONDS = 0.05
STARTUP_TIMEOUT_SECONDS = 15
SHUTDOWN_TIMEOUT_SECONDS = 5

class ServerStartError(Exception):
    pass

class BackgroundServer:
    def __init__(self, app: FastAPI, host: str, port: int):
        config = uvicorn.Config(app, host=host, port=port, log_level=LOG_LEVEL, log_config=None)
        self._server = uvicorn.Server(config)
        self._thread = threading.Thread(target=self._server.run, daemon=True)

    def start(self) -> None:
        self._thread.start()
        deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
        while not self._server.started:
            if not self._thread.is_alive() or time.monotonic() > deadline:
                raise ServerStartError()
            time.sleep(STARTUP_POLL_SECONDS)

    def stop(self) -> None:
        self._server.should_exit = True
        self._thread.join(SHUTDOWN_TIMEOUT_SECONDS)
