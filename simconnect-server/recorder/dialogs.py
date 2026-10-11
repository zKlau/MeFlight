import ctypes

APP_TITLE = "MeFlight"
MB_OK = 0x0
MB_YESNO = 0x4
MB_ICONERROR = 0x10
MB_ICONWARNING = 0x30
MB_TOPMOST = 0x40000
IDYES = 6

def _message_box(message: str, flags: int) -> int:
    return ctypes.windll.user32.MessageBoxW(None, message, APP_TITLE, flags | MB_TOPMOST)

def show_error(message: str) -> None:
    _message_box(message, MB_OK | MB_ICONERROR)

def ask_yes_no(message: str) -> bool:
    return _message_box(message, MB_YESNO | MB_ICONWARNING) == IDYES
