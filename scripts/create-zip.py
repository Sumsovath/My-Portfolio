"""Create verified source and deployment archives for the portfolio."""

from __future__ import annotations

import re
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SOURCE_ZIP = ROOT / "sum-sovath-portfolio-source.zip"
DEPLOY_ZIP = ROOT / "sum-sovath-portfolio-deploy.zip"

EXCLUDED_DIRECTORIES = {
    ".git",
    ".idea",
    ".vercel",
    ".vscode",
    "__pycache__",
    "backups",
    "coverage",
    "dist",
    "node_modules",
    "outputs",
    "tmp",
    "work",
}
EXCLUDED_SUFFIXES = {".log", ".pyc", ".tmp", ".zip"}
TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".txt",
    ".yaml",
    ".yml",
}
SECRET_FILE_NAMES = {
    "credentials.json",
    "id_ed25519",
    "id_rsa",
    "service-account.json",
}
SECRET_PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "GitHub token": re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "OpenAI API key": re.compile(r"\bsk-[A-Za-z0-9_-]{24,}\b"),
    "credentialed URL": re.compile(r"https?://[^\s/:]+:[^\s/@]+@[^\s/\"']+"),
}


def is_secret_filename(path: Path) -> bool:
    name = path.name.lower()
    if name == ".env.example":
        return False
    return (
        name == ".env"
        or name.startswith(".env.")
        or name in SECRET_FILE_NAMES
        or path.suffix.lower() in {".key", ".pem", ".p12", ".pfx"}
    )


def should_include_source(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if any(part.lower() in EXCLUDED_DIRECTORIES for part in relative.parts[:-1]):
        return False
    if path in {SOURCE_ZIP, DEPLOY_ZIP}:
        return False
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    return not is_secret_filename(path)


def collect_source_files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*")
        if path.is_file() and should_include_source(path)
    )


def collect_deploy_files() -> list[Path]:
    if not DIST.is_dir():
        raise RuntimeError("The dist folder does not exist. Run npm run build first.")
    return sorted(path for path in DIST.rglob("*") if path.is_file())


def scan_for_secrets(files: list[Path]) -> None:
    problems: list[str] = []
    for path in files:
        if is_secret_filename(path):
            problems.append(f"sensitive filename: {path.relative_to(ROOT)}")
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES or path.stat().st_size > 2_000_000:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for label, pattern in SECRET_PATTERNS.items():
            matches = list(pattern.finditer(text))
            if label == "credentialed URL":
                matches = [match for match in matches if "example.com" not in match.group(0).lower()]
            if matches:
                problems.append(f"possible {label}: {path.relative_to(ROOT)}")

    if problems:
        details = "\n".join(f"- {problem}" for problem in problems)
        raise RuntimeError(f"Archive creation stopped because sensitive data may be present:\n{details}")


def create_archive(output: Path, files: list[Path], base: Path) -> None:
    output.unlink(missing_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            archive.write(path, path.relative_to(base).as_posix())


def verify_archive(path: Path, deployment: bool = False) -> tuple[int, int]:
    with zipfile.ZipFile(path, "r") as archive:
        names = archive.namelist()
        if not names:
            raise RuntimeError(f"{path.name} is empty.")
        for name in names:
            archive_path = PurePosixPath(name)
            lowered_parts = {part.lower() for part in archive_path.parts}
            if archive_path.is_absolute() or ".." in archive_path.parts:
                raise RuntimeError(f"Unsafe path in {path.name}: {name}")
            if lowered_parts & EXCLUDED_DIRECTORIES:
                raise RuntimeError(f"Excluded directory found in {path.name}: {name}")
            if is_secret_filename(Path(name)):
                raise RuntimeError(f"Sensitive filename found in {path.name}: {name}")
        if deployment and "index.html" not in names:
            raise RuntimeError("Deployment archive does not contain index.html at its root.")
        bad_file = archive.testzip()
        if bad_file:
            raise RuntimeError(f"CRC verification failed for {bad_file} in {path.name}.")
        return len(names), sum(info.file_size for info in archive.infolist())


def main() -> None:
    source_files = collect_source_files()
    deploy_files = collect_deploy_files()
    scan_for_secrets(source_files)
    scan_for_secrets(deploy_files)

    create_archive(SOURCE_ZIP, source_files, ROOT)
    create_archive(DEPLOY_ZIP, deploy_files, DIST)

    source_count, source_bytes = verify_archive(SOURCE_ZIP)
    deploy_count, deploy_bytes = verify_archive(DEPLOY_ZIP, deployment=True)
    print(f"Created {SOURCE_ZIP.name}: {source_count} files, {source_bytes:,} uncompressed bytes")
    print(f"Created {DEPLOY_ZIP.name}: {deploy_count} files, {deploy_bytes:,} uncompressed bytes")
    print("Secret scan and ZIP integrity checks passed.")


if __name__ == "__main__":
    main()
