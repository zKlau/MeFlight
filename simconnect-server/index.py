import webbrowser
import uvicorn
from recorder.api_client import ApiClient
from recorder.config import load_config
from recorder.local_app import create_app
from recorder.recorder import Recorder
from recorder.sim import Sim

def main() -> None:
    config = load_config()
    api = ApiClient(config)
    recorder = Recorder(Sim(), api, config.interval_seconds)
    app = create_app(recorder, api)
    local_url = f"http://{config.local_host}:{config.local_port}"

    print(f"MeFlight recorder UI: {local_url} (sending to {config.api_base_url})", flush=True)
    webbrowser.open(local_url)
    uvicorn.run(app, host=config.local_host, port=config.local_port, log_level="warning")

if __name__ == "__main__":
    main()
