"""Reproduce the reviewed game crops without making any paid requests.

Requires Pillow 11.3.0. Original DreamLayer output pixels remain in assets/source/.
Only crop/padding and delivery encoding happen here; no artwork is painted.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/source/generated"
OUTPUT = ROOT / "demo/assets/generated"
OUTPUT.mkdir(parents=True, exist_ok=True)
background = Image.open(SOURCE / "environment.png")
assert background.size == (2560, 1440), "Review any new output before changing import geometry"
background.resize((1920, 1080), Image.Resampling.LANCZOS).save(
    OUTPUT / "environment.webp", quality=90, method=6
)
sheet = Image.open(SOURCE / "objects-transparent.png")
assert sheet.size == (1365, 768) and sheet.mode == "RGBA"
assert sheet.getchannel("A").getextrema() == (0, 255)
crops = []
for i, name in enumerate(["rover", "drone", "planter", "cell", "dock", "beacon"]):
    x, y = i % 3 * 455, i // 3 * 384
    tile = sheet.crop((x, y, x + 455, y + 384))
    box = tile.getchannel("A").getbbox()
    assert box is not None, f"Empty {name} cell"
    left, top, right, bottom = box
    assert left > 0 and top > 0 and right < 455 and bottom < 384, f"{name} reaches a cell edge; review before cropping"
    crop = tile.crop(box)
    result = Image.new("RGBA", (crop.width + 16, crop.height + 16))
    result.paste(crop, (8, 8))
    result.save(OUTPUT / f"{name}.png", optimize=True)
    crops.append({"asset": name, "sourceRect": [x + left, y + top, x + right, y + bottom],
                  "padding": 8, "width": result.width, "height": result.height})
(ROOT / "assets/crops.json").write_text(json.dumps({
    "source": "assets/source/generated/objects-transparent.png",
    "method": "Reviewed 3-by-2 grid, trim to nonzero alpha, add 8 transparent pixels on each side; no resampling of object pixels",
    "backgroundDelivery": "2560x1440 RGB PNG resized to 1920x1080 WebP, quality 90, Pillow 11.3.0",
    "crops": crops,
}, indent=2) + "\n")
print(json.dumps(crops, indent=2))
