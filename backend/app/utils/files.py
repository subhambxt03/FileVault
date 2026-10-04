import re


EXT_MAP = {
    "jpg": ("image", "image/jpeg"),
    "jpeg": ("image", "image/jpeg"),
    "png": ("image", "image/png"),
    "webp": ("image", "image/webp"),
    "pdf": ("pdf", "application/pdf"),
    "txt": ("text", "text/plain"),
}

ALLOWED_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
}

_sanitize_re = re.compile(r"[^A-Za-z0-9_.\- ]+")


def sanitize_filename(name: str) -> str:
    name = name.replace("\\", "/").split("/")[-1]
    name = _sanitize_re.sub("_", name).strip("._")
    return name[:180] or "file"


def classify_upload(filename: str, content_type: str | None) -> str | None:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    entry = EXT_MAP.get(ext)
    if not entry:
        return None
    processing_type, expected_mime = entry

    
    if content_type and content_type != "application/octet-stream":
        if content_type not in ALLOWED_MIME:
            return None
        # JPEG/PNG/etc must at least match the family
        if not content_type.startswith(processing_type.split("/")[0][:5]) and not (
            content_type == expected_mime
        ):
            # allow any image/* for image uploads
            if processing_type == "image" and content_type.startswith("image/"):
                return processing_type
            if content_type != expected_mime:
                return None
    return processing_type