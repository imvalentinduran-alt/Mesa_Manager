#!/usr/bin/env python3
"""
Empaqueta api/main.py con PyInstaller en modo --onedir y deposita el directorio en
src-tauri/binaries/api_dir/ listo para ser incluido como resource de Tauri.

Uso:
    python scripts/build_sidecar.py
"""
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT      = Path(__file__).resolve().parent.parent
ENTRY     = ROOT / "api" / "main.py"
DIST_DIR  = ROOT / "dist"
BUILD_DIR = ROOT / "build"
DEST_DIR  = ROOT / "src-tauri" / "binaries" / "api_dir"


def build() -> None:
    print("[sidecar] Modo: --onedir (sin extracción en runtime)")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onedir",
        "--noconsole",
        "--noconfirm",
        "--name", "main",
        "--distpath",  str(DIST_DIR),
        "--workpath",  str(BUILD_DIR),
        "--specpath",  str(ROOT),
        "--collect-all", "uvicorn",
        "--collect-all", "fastapi",
        "--collect-all", "starlette",
        "--collect-all", "pydantic",
        "--collect-all", "pydantic_core",
        "--hidden-import", "bcrypt",
        "--hidden-import", "psycopg2",
        str(ENTRY),
    ]

    print("[sidecar] Ejecutando PyInstaller…")
    result = subprocess.run(cmd, cwd=str(ROOT))
    if result.returncode != 0:
        print("[sidecar] ERROR: PyInstaller terminó con fallo.", file=sys.stderr)
        sys.exit(result.returncode)

    src = DIST_DIR / "main"
    if not src.exists():
        print(f"[sidecar] ERROR: no se encontró el directorio en {src}", file=sys.stderr)
        sys.exit(1)

    if DEST_DIR.exists():
        shutil.rmtree(DEST_DIR)
    shutil.copytree(str(src), str(DEST_DIR))
    print(f"[sidecar] Directorio listo: src-tauri/binaries/api_dir/")
    print(f"[sidecar] Archivos: {len(list(DEST_DIR.rglob('*')))} items")


if __name__ == "__main__":
    build()
