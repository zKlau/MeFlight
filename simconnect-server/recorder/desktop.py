import webview
from recorder.dialogs import ask_yes_no
from recorder.paths import webview_storage_dir
from recorder.recorder import Recorder

WINDOW_TITLE = "MeFlight Recorder"
WINDOW_WIDTH = 1280
WINDOW_HEIGHT = 860
MIN_WINDOW_SIZE = (900, 600)
WEBVIEW_GUI = "edgechromium"
QUIT_WHILE_RECORDING = "A flight is being recorded. Stop recording and quit MeFlight?"

def _allow_close(recorder: Recorder) -> bool:
    if not recorder.status()["recording"]:
        return True
    return ask_yes_no(QUIT_WHILE_RECORDING)

def run_window(url: str, recorder: Recorder) -> None:
    window = webview.create_window(
        WINDOW_TITLE,
        url,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=MIN_WINDOW_SIZE,
    )
    window.events.closing += lambda: _allow_close(recorder)
    webview.start(gui=WEBVIEW_GUI, private_mode=False, storage_path=str(webview_storage_dir()))
