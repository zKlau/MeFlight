import sys
import webbrowser
import uvicorn
from recorder.api_client import ApiClient
from recorder.config import env_settings, load_config
from recorder.desktop import run_window
from recorder.dialogs import show_error
from recorder.local_app import create_app
from recorder.logs import setup_logging
from recorder.recorder import Recorder
from recorder.server import BackgroundServer, ServerStartError
from recorder.settings import load_settings
from recorder.sim import Sim

BROWSER_FLAG = "--browser"
LOG_LEVEL = "warning"
ALREADY_RUNNING_MESSAGE = "MeFlight could not start on port {port}. It is probably already running."
WEBVIEW_MISSING_MESSAGE = (
    "MeFlight needs the Microsoft Edge WebView2 Runtime to show its window.\n\n"
    "Install it from https://go.microsoft.com/fwlink/p/?LinkId=2124703 and start MeFlight again.\n\n"
    "Details: {error}"
)

def run_in_browser(app, host: str, port: int, local_url: str) -> None:
    print(f"MeFlight recorder UI: {local_url}", flush=True)
    webbrowser.open(local_url)
    uvicorn.run(app, host=host, port=port, log_level=LOG_LEVEL)

def run_desktop(app, recorder: Recorder, host: str, port: int, local_url: str) -> None:
    server = BackgroundServer(app, host, port)
    try:
        server.start()
    except ServerStartError:
        show_error(ALREADY_RUNNING_MESSAGE.format(port=port))
        return
    try:
        run_window(local_url, recorder)
    except Exception as error:
        show_error(WEBVIEW_MISSING_MESSAGE.format(error=error))
    finally:
        server.stop()

def main() -> None:
    setup_logging()
    config = load_config()
    api = ApiClient(load_settings(env_settings()))
    recorder = Recorder(Sim(), api, config.interval_seconds)
    app = create_app(recorder, api)
    local_url = f"http://{config.local_host}:{config.local_port}"

    if BROWSER_FLAG in sys.argv:
        run_in_browser(app, config.local_host, config.local_port, local_url)
        return
    run_desktop(app, recorder, config.local_host, config.local_port, local_url)

if __name__ == "__main__":
    main()
