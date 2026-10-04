import io

from PIL import Image

from app.utils.processors import process_image, process_pdf, process_text


def _make_image_bytes() -> bytes:
    img = Image.new("RGB", (2000, 1500), (120, 40, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_process_image_generates_three_sizes():
    outputs = process_image(_make_image_bytes())
    assert set(outputs.keys()) == {"small", "medium", "large"}

    for label, data in outputs.items():
        img = Image.open(io.BytesIO(data))
        assert max(img.size) <= {"small": 320, "medium": 800, "large": 1280}[label]


def test_process_text_word_frequency():
    freq = process_text(b"Hello hello world WORLD world world")
    assert freq["world"] == 3
    assert freq["hello"] == 2


def test_process_pdf_invalid_raises():
    try:
        process_pdf(b"not a pdf")
    except ValueError:
        return
    raise AssertionError("Expected ValueError for invalid PDF")