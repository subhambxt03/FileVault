
import io
import re
from collections import Counter

import fitz  # PyMuPDF
from PIL import Image, UnidentifiedImageError

SIZES = {"small": 320, "medium": 800, "large": 1280}

_WORD_RE = re.compile(r"[A-Za-z']+")


def process_image(data: bytes) -> dict[str, bytes]:
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(f"Corrupted or unsupported image: {exc}") from exc

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    outputs: dict[str, bytes] = {}
    for label, max_side in SIZES.items():
        copy = img.copy()
        copy.thumbnail((max_side, max_side), Image.LANCZOS)
        buf = io.BytesIO()
        copy.save(buf, format="JPEG", quality=85, optimize=True)
        outputs[label] = buf.getvalue()
    return outputs


def process_pdf(data: bytes) -> str:
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Corrupted PDF: {exc}") from exc

    if doc.is_encrypted:
        raise ValueError("PDF is password protected.")

    chunks = []
    for page in doc:
        chunks.append(page.get_text("text"))
    doc.close()

    text = "\n".join(chunks).strip()
    return text if text else "(No text extracted.)"


def process_text(data: bytes) -> dict[str, int]:
    try:
        text = data.decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Cannot decode text: {exc}") from exc

    words = [w.lower() for w in _WORD_RE.findall(text)]
    if not words:
        return {}
    counter = Counter(words)
    return dict(counter.most_common(50))


def process_avatar(data: bytes, size: int = 256) -> bytes:
    """Center-crop an image to a square and resize to `size`x`size` JPEG."""
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(f"Invalid image: {exc}") from exc

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((size, size), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88, optimize=True)
    return buf.getvalue()
