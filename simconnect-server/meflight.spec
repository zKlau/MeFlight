from PyInstaller.utils.hooks import collect_dynamic_libs, collect_submodules

APP_NAME = "MeFlight"
ICON_PATH = "assets/meflight.ico"

analysis = Analysis(
    ["index.py"],
    datas=[("static", "static")],
    binaries=collect_dynamic_libs("SimConnect"),
    hiddenimports=collect_submodules("uvicorn"),
    excludes=["tkinter"],
)
pyz = PYZ(analysis.pure)
exe = EXE(
    pyz,
    analysis.scripts,
    analysis.binaries,
    analysis.datas,
    [],
    name=APP_NAME,
    icon=ICON_PATH,
    console=False,
    upx=False,
)
