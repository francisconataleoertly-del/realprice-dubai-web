from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from pptx import Presentation
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUT_DESKTOP = Path.home() / "OneDrive" / "Desktop" / "FonatProp_Broker_Deck_PREMIUM.pptx"
OUT_DOWNLOADS = Path.home() / "Downloads" / "FonatProp_Broker_Deck_PREMIUM.pptx"
OUT_DATA_LAKE = Path.home() / "FonatProp_Data_Lake" / "05_decks" / "FonatProp_Broker_Deck_PREMIUM.pptx"
DEMO_URL = "https://fonatprop.com/broker-demo"
DECK_MEDIA = ROOT / "public" / "deck-media"

W, H = 1920, 1080
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG_IMAGES = [
    ROOT / "public" / "dubai-slides" / "02-burj-khalifa.jpg",
    ROOT / "public" / "dubai-slides" / "01-marina-skyline.jpg",
    ROOT / "public" / "dubai-slides" / "04-marina-night.jpg",
    ROOT / "public" / "dubai-slides" / "07-marina-aerial.jpg",
    ROOT / "public" / "dubai-slides" / "03-burj-al-arab.jpg",
    ROOT / "public" / "dubai-slides" / "05-downtown-night.jpg",
]

LOGO = ROOT / "public" / "brand" / "fonatprop-logo-lockup-transparent.webp"
MARK = ROOT / "public" / "brand" / "fonatprop-final-icon.png"
QR = ROOT / "public" / "brand" / "broker-demo-qr.png"
VALUATION_VIDEO = Path(
    r"C:\Users\franc\Videos\Captures\FonatProp Broker Demo _ Valuation + Widget - Google Chrome 2026-04-29 20-29-25.mp4"
)
WIDGET_VIDEO = Path(
    r"C:\Users\franc\Videos\Captures\FonatProp Broker Demo _ Valuation + Widget - Google Chrome 2026-04-29 20-28-19.mp4"
)
VALUATION_POSTER = DECK_MEDIA / "valuation-poster.png"
WIDGET_POSTER = DECK_MEDIA / "widget-poster.png"

WHITE = (248, 250, 252)
SOFT = (194, 201, 216)
MUTED = (134, 145, 166)
BLUE = (82, 152, 255)
CYAN = (112, 202, 255)
GOLD = (235, 196, 105)
CARD = (8, 13, 25, 215)
CARD2 = (9, 15, 29, 232)
INK = (3, 5, 10)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "serif": [
            "C:/Windows/Fonts/georgiab.ttf",
            "C:/Windows/Fonts/georgia.ttf",
            "C:/Windows/Fonts/timesbd.ttf",
        ],
        "serif_i": [
            "C:/Windows/Fonts/georgiai.ttf",
            "C:/Windows/Fonts/georgia.ttf",
        ],
        "sans": [
            "C:/Windows/Fonts/aptos.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ],
        "sans_b": [
            "C:/Windows/Fonts/aptosbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
        ],
        "mono": [
            "C:/Windows/Fonts/consolab.ttf",
            "C:/Windows/Fonts/consola.ttf",
        ],
    }
    for path in candidates[name]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


SERIF_88 = font("serif", 88)
SERIF_78 = font("serif", 78)
SERIF_66 = font("serif", 66)
SERIF_56 = font("serif", 56)
SERIF_I_76 = font("serif_i", 76)
SERIF_I_58 = font("serif_i", 58)
SANS_32 = font("sans", 32)
SANS_28 = font("sans", 28)
SANS_24 = font("sans", 24)
SANS_22 = font("sans", 22)
SANS_20 = font("sans", 20)
SANS_18 = font("sans", 18)
SANS_B_34 = font("sans_b", 34)
SANS_B_28 = font("sans_b", 28)
SANS_B_22 = font("sans_b", 22)
SANS_B_18 = font("sans_b", 18)
MONO_18 = font("mono", 18)
MONO_15 = font("mono", 15)


def cover_image(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGB")
    ratio = max(W / img.width, H / img.height)
    new_size = (int(img.width * ratio), int(img.height * ratio))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    left = (img.width - W) // 2
    top = (img.height - H) // 2
    return img.crop((left, top, left + W, top + H))


def premium_bg(path: Path, dark: int = 88) -> Image.Image:
    img = cover_image(path)
    img = ImageEnhance.Brightness(img).enhance(1.0)
    img = ImageEnhance.Contrast(img).enhance(1.08)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, max(48, dark - 22)))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    # Organic left-side readability glow instead of a dark rectangle.
    left_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lg = ImageDraw.Draw(left_glow)
    lg.ellipse((-260, 40, 1180, 1260), fill=(2, 5, 12, 118))
    left_glow = left_glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, left_glow)

    # Soft cinematic top/bottom shaping.
    atmosphere = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ad = ImageDraw.Draw(atmosphere)
    ad.ellipse((980, -180, 2120, 620), fill=(24, 74, 122, 44))
    ad.rectangle((0, 0, W, 180), fill=(0, 0, 0, 26))
    ad.rectangle((0, H - 180, W, H), fill=(0, 0, 0, 56))
    atmosphere = atmosphere.filter(ImageFilter.GaussianBlur(70))
    img = Image.alpha_composite(img, atmosphere)

    return img


def paste_logo(canvas: Image.Image, xy: tuple[int, int] = (92, 70), width: int = 214) -> None:
    path = LOGO if LOGO.exists() else MARK
    if not path.exists():
        return
    logo = Image.open(path).convert("RGBA")
    ratio = width / logo.width
    logo = logo.resize((width, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, xy)


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fnt, fill=WHITE, spacing=8) -> None:
    draw.multiline_text(xy, text, font=fnt, fill=fill, spacing=spacing)


def wrap_text(text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    scratch = Image.new("RGB", (10, 10))
    d = ImageDraw.Draw(scratch)
    for word in words:
        trial = f"{cur} {word}".strip()
        if d.textbbox((0, 0), trial, font=fnt)[2] <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def paragraph(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, max_width: int, fnt, fill=SOFT, line_gap: int = 12) -> int:
    lines = wrap_text(text, fnt, max_width)
    line_h = dheight(fnt) + line_gap
    for i, line_text in enumerate(lines):
        draw.text((x, y + i * line_h), line_text, font=fnt, fill=fill)
    return y + len(lines) * line_h


def dheight(fnt) -> int:
    box = fnt.getbbox("Ag")
    return box[3] - box[1]


def label(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, fill=CYAN) -> None:
    draw.text((x, y), text.upper(), font=MONO_18, fill=fill)
    draw.rounded_rectangle((x, y + 34, x + 132, y + 39), radius=2, fill=fill)


def footer(draw: ImageDraw.ImageDraw, idx: int) -> None:
    draw.text((1660, 1018), f"0{idx} / FONATPROP", font=MONO_15, fill=(126, 136, 154))


def rounded_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill=CARD, outline=(57, 83, 130), width=2, radius=28) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def video_placeholder(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    tag: str,
    title_text: str,
    accent,
    subtitle: str = "Embedded product video. Click to play in PowerPoint.",
) -> None:
    rounded_card(draw, box, fill=(8, 13, 25, 234), outline=accent, width=3, radius=34)
    x1, y1, x2, y2 = box
    draw.text((x1 + 28, y1 + 24), tag.upper(), font=MONO_15, fill=accent)
    draw.text((x1 + 28, y1 + 62), title_text, font=SANS_B_28, fill=WHITE)
    draw.text((x1 + 28, y2 - 46), subtitle, font=SANS_18, fill=SOFT)
    inner = (x1 + 28, y1 + 110, x2 - 28, y2 - 66)
    draw.rounded_rectangle(inner, radius=24, fill=(16, 22, 38, 180), outline=(72, 100, 156), width=2)
    cx = (inner[0] + inner[2]) // 2
    cy = (inner[1] + inner[3]) // 2
    draw.ellipse((cx - 44, cy - 44, cx + 44, cy + 44), fill=(248, 250, 252, 230))
    draw.polygon([(cx - 10, cy - 16), (cx - 10, cy + 16), (cx + 18, cy)], fill=INK)


def copy_block(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    *,
    body_font=SANS_24,
    fill=(8, 13, 25, 182),
    outline=(56, 82, 126),
    text_fill=SOFT,
    radius: int = 28,
    pad_x: int = 30,
    pad_y: int = 28,
    line_gap: int = 10,
) -> None:
    rounded_card(draw, box, fill=fill, outline=outline, radius=radius)
    x1, y1, x2, _ = box
    paragraph(draw, text, x1 + pad_x, y1 + pad_y, x2 - x1 - pad_x * 2, body_font, text_fill, line_gap)


def metric(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], value: str, cap: str) -> None:
    rounded_card(draw, box, fill=(8, 13, 25, 190), outline=(65, 101, 166), radius=20)
    x1, y1, x2, _ = box
    draw.text((x1 + 24, y1 + 18), value, font=SERIF_56, fill=WHITE)
    draw.text((x1 + 24, y1 + 92), cap.upper(), font=MONO_15, fill=MUTED)


def bullet_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title_text: str, bullets: list[str]) -> None:
    rounded_card(draw, box, fill=(8, 13, 25, 228), outline=(74, 109, 171), radius=38)
    x1, y1, x2, _ = box
    draw.text((x1 + 44, y1 + 42), title_text.upper(), font=MONO_18, fill=BLUE)
    y = y1 + 108
    for i, bullet in enumerate(bullets):
        draw.ellipse((x1 + 44, y + 10, x1 + 56, y + 22), fill=BLUE if i == 0 else CYAN)
        y = paragraph(draw, bullet, x1 + 84, y, x2 - x1 - 132, SANS_24, WHITE if i == 0 else SOFT, 8) + 20


def product_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], tag: str, title_text: str, copy: str, accent) -> None:
    rounded_card(draw, box, fill=CARD2, outline=accent, radius=24, width=3)
    x1, y1, x2, _ = box
    draw.text((x1 + 34, y1 + 30), tag.upper(), font=MONO_15, fill=accent)
    draw.text((x1 + 34, y1 + 78), title_text, font=SERIF_56, fill=WHITE)
    paragraph(draw, copy, x1 + 34, y1 + 156, x2 - x1 - 68, SANS_22, SOFT, 8)


def step_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], number: str, title_text: str, copy: str) -> None:
    rounded_card(draw, box, fill=(8, 13, 25, 214), outline=(67, 97, 154), radius=22)
    x1, y1, x2, _ = box
    draw.text((x1 + 28, y1 + 22), number, font=MONO_18, fill=BLUE)
    draw.text((x1 + 84, y1 + 14), title_text, font=SERIF_56, fill=WHITE)
    paragraph(draw, copy, x1 + 28, y1 + 78, x2 - x1 - 56, SANS_20, SOFT, 8)


def pricing_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], name: str, aed: str, usd: str, accent, featured=False) -> None:
    rounded_card(draw, box, fill=(8, 13, 25, 235), outline=accent, width=3 if featured else 2, radius=26)
    x1, y1, x2, _ = box
    if featured:
        draw.rounded_rectangle((x1 + 28, y1 + 24, x1 + 174, y1 + 58), radius=8, fill=accent)
        draw.text((x1 + 58, y1 + 32), "POPULAR", font=MONO_15, fill=INK)
        name_y = y1 + 82
    else:
        name_y = y1 + 45
    draw.text((x1 + 28, name_y), name, font=SANS_B_22, fill=SOFT)
    price_font = SERIF_56 if (x2 - x1) >= 300 and len(aed) <= 9 else SERIF_66 if len(aed) <= 8 else SANS_B_34
    if (x2 - x1) < 280:
        price_font = SANS_B_34
    price_box = draw.textbbox((0, 0), aed, font=price_font)
    price_w = price_box[2] - price_box[0]
    draw.text((x1 + ((x2 - x1) - price_w) / 2, y1 + 128), aed, font=price_font, fill=WHITE)
    usd_box = draw.textbbox((0, 0), usd, font=SANS_20)
    usd_w = usd_box[2] - usd_box[0]
    draw.text((x1 + ((x2 - x1) - usd_w) / 2, y1 + 206), usd, font=SANS_20, fill=MUTED)


def slide_1() -> Image.Image:
    img = premium_bg(BG_IMAGES[0], 80)
    draw = ImageDraw.Draw(img)
    paste_logo(img, (92, 72), 230)
    label(draw, "Dubai brokerages", 96, 210)
    draw.text((96, 282), "AI valuation.", font=SERIF_88, fill=WHITE)
    draw.text((96, 382), "Qualified leads.", font=SERIF_I_76, fill=SOFT)
    copy_block(
        draw,
        (96, 512, 1040, 694),
        "FonatProp gives brokerages a private AI valuation workflow and a public website widget. The model is backed by 234K+ real Dubai transactions.",
        body_font=SANS_28,
        fill=(8, 13, 25, 168),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=30,
        line_gap=12,
    )
    metric(draw, (100, 758, 368, 904), "234K+", "real transactions")
    metric(draw, (408, 758, 676, 904), "AI", "valuation model")
    metric(draw, (716, 758, 984, 904), "Widget", "lead capture")
    footer(draw, 1)
    return img


def slide_2() -> Image.Image:
    img = premium_bg(BG_IMAGES[1], 74)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Trust", 96, 184)
    draw.text((96, 262), "Who builds FonatProp.", font=SERIF_78, fill=WHITE)
    draw.text((96, 350), "Young operators.", font=SERIF_I_58, fill=SOFT)
    copy_block(
        draw,
        (96, 470, 1010, 656),
        "FonatProp is led by Francisco, a professional footballer, Sagrado Corazon graduate and 4th-year UAI student. The project is being built by a young team working inside real estate and applying AI to it.",
        body_font=SANS_28,
        fill=(8, 13, 25, 168),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=28,
        line_gap=12,
    )
    rounded_card(draw, (96, 720, 760, 962), fill=CARD2, outline=BLUE, radius=24, width=3)
    draw.text((130, 752), "FOUNDER PROFILE", font=MONO_15, fill=BLUE)
    draw.text((130, 800), "Personal profile", font=SANS_B_34, fill=WHITE)
    paragraph(
        draw,
        "Professional footballer. Sagrado Corazon graduate. UAI, 4th year. Building the product while staying close to the market.",
        130,
        872,
        560,
        SANS_24,
        SOFT,
        8,
    )
    bullet_panel(
        draw,
        (1096, 206, 1812, 890),
        "FonatProp today",
        [
            "Young team working across the real estate industry and AI implementation.",
            "Dubai workflow live today: private valuations plus public lead capture.",
            "France portal already in build as the second market inside the product.",
            "Trust matters: agencies should know who is behind the platform they buy.",
        ],
    )
    footer(draw, 2)
    return img


def slide_3() -> Image.Image:
    img = premium_bg(BG_IMAGES[1], 72)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Pain", 96, 214)
    draw.text((96, 292), "Slow valuations.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "Lost website leads.", font=SERIF_I_76, fill=SOFT)
    copy_block(
        draw,
        (96, 532, 988, 712),
        "Many brokerages still value homes through broker opinion, manual comps and long back-and-forth. At the same time, website visitors leave before they share their details.",
        body_font=SANS_28,
        fill=(8, 13, 25, 166),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=28,
        line_gap=12,
    )
    bullet_panel(
        draw,
        (1190, 226, 1800, 762),
        "What breaks",
        [
            "Valuations depend on broker opinion more than hard evidence.",
            "Teams spend too much time pricing one property.",
            "Owners want a value view before a meeting or call.",
            "Website traffic does not convert into qualified leads.",
        ],
    )
    footer(draw, 3)
    return img


def slide_4() -> Image.Image:
    img = premium_bg(BG_IMAGES[2], 76)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Private AI", 96, 214)
    draw.text((96, 292), "Fast valuations.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "Real evidence.", font=SERIF_I_76, fill=SOFT)
    copy_block(
        draw,
        (96, 540, 860, 724),
        "The broker workflow starts with the address, infers property context and returns guided pricing backed by 234K+ real Dubai transactions, not broker opinion alone.",
        body_font=SANS_28,
        fill=(8, 13, 25, 168),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=30,
        line_gap=12,
    )
    video_placeholder(
        draw,
        (930, 210, 1812, 886),
        "Private AI workflow",
        "AI valuation demo",
        BLUE,
        subtitle="Embedded product video. Click to play in PowerPoint.",
    )
    footer(draw, 4)
    return img


def slide_5() -> Image.Image:
    img = premium_bg(BG_IMAGES[3], 76)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Public AI", 96, 214)
    draw.text((96, 292), "Website widget.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "Broad AI range.", font=SERIF_I_76, fill=SOFT)
    copy_block(
        draw,
        (96, 540, 860, 724),
        "The website widget captures the lead first, then shows a broad AI valuation range. The agency keeps the contact data and the client gets a premium first experience.",
        body_font=SANS_28,
        fill=(8, 13, 25, 168),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=30,
        line_gap=12,
    )
    video_placeholder(
        draw,
        (930, 210, 1812, 886),
        "Public AI workflow",
        "Widget demo",
        GOLD,
        subtitle="Embedded product video. Click to play in PowerPoint.",
    )
    footer(draw, 5)
    return img


def slide_6() -> Image.Image:
    img = premium_bg(BG_IMAGES[4], 70)
    draw = ImageDraw.Draw(img)
    paste_logo(img, (92, 64), 206)
    label(draw, "Plans", 96, 156, GOLD)
    draw.text((96, 232), "Simple pricing", font=SERIF_78, fill=WHITE)
    draw.text((96, 320), "For one brokerage.", font=SERIF_I_58, fill=SOFT)

    rounded_card(draw, (96, 408, 520, 932), fill=(8, 13, 25, 236), outline=GOLD, width=4, radius=38)
    draw.rounded_rectangle((128, 446, 266, 482), radius=10, fill=GOLD)
    draw.text((154, 468), "WIDGET", font=MONO_15, fill=INK)
    draw.text((128, 532), "Lead capture", font=SANS_B_34, fill=WHITE)
    draw.text((128, 598), "AED 1,099", font=SERIF_66, fill=WHITE)
    draw.text((132, 668), "$299 / month", font=SANS_24, fill=SOFT)
    paragraph(draw, "Public website widget for one brokerage site.", 128, 734, 330, SANS_20, SOFT, 6)
    rounded_card(draw, (128, 826, 488, 892), fill=(11, 18, 33, 236), outline=(88, 115, 171), radius=18)
    draw.text((154, 848), "Single-site license", font=SANS_B_18, fill=WHITE)
    draw.text((358, 848), "Live", font=MONO_15, fill=GOLD)

    plans_box = (580, 392, 1812, 940)
    rounded_card(draw, plans_box, fill=(8, 13, 25, 238), outline=(62, 94, 153), width=3, radius=38)
    draw.text((628, 432), "AI valuation plans", font=SANS_B_34, fill=WHITE)
    draw.text((628, 478), "Monthly access for agents and brokerage teams.", font=SANS_22, fill=SOFT)
    draw.text((1450, 444), "From AED 1,465", font=SANS_B_22, fill=WHITE)
    draw.text((1450, 476), "Starts at 10 valuations / month", font=SANS_18, fill=SOFT)

    rows = [
        ("10 valuations / month", "AED 1,465", "$399 / mo", False),
        ("20 valuations / month", "AED 2,199", "$599 / mo", True),
        ("50 valuations / month", "AED 4,400", "$1,199 / mo", False),
        ("100 valuations / month", "AED 7,345", "$2,000 / mo", False),
        ("200 valuations / month", "AED 12,855", "$3,500 / mo", False),
    ]
    y = 534
    for title_text, aed, usd, featured in rows:
        fill = (14, 22, 38, 232) if not featured else (16, 24, 40, 244)
        outline = GOLD if featured else (50, 74, 122)
        draw.rounded_rectangle((628, y, 1768, y + 60), radius=22, fill=fill, outline=outline, width=3 if featured else 2)
        if featured:
            draw.rounded_rectangle((648, y + 15, 744, y + 43), radius=10, fill=GOLD)
            draw.text((670, y + 22), "POPULAR", font=MONO_15, fill=INK)
            title_x = 772
        else:
            title_x = 660
        draw.text((title_x, y + 16), title_text, font=SANS_B_22, fill=WHITE)
        aed_box = draw.textbbox((0, 0), aed, font=SANS_B_28)
        aed_w = aed_box[2] - aed_box[0]
        usd_box = draw.textbbox((0, 0), usd, font=SANS_20)
        usd_w = usd_box[2] - usd_box[0]
        draw.text((1464 - aed_w / 2, y + 12), aed, font=SANS_B_28, fill=WHITE)
        draw.text((1662 - usd_w / 2, y + 20), usd, font=SANS_20, fill=SOFT)
        y += 72
    draw.text((628, 900), "Extra credits and custom bundles available on request.", font=SANS_18, fill=SOFT)
    footer(draw, 6)
    return img


def slide_7() -> Image.Image:
    img = premium_bg(BG_IMAGES[5], 74)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Next step", 96, 214)
    draw.text((96, 292), "Open the demo.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "Review the flow.", font=SERIF_I_76, fill=SOFT)
    copy_block(
        draw,
        (96, 528, 1038, 702),
        "Review the live product, test the AI valuation flow and see how the widget captures leads before an agent call.",
        body_font=SANS_28,
        fill=(8, 13, 25, 162),
        outline=(61, 92, 144),
        pad_x=32,
        pad_y=28,
        line_gap=12,
    )
    rounded_card(draw, (96, 748, 1096, 972), fill=(8, 13, 25, 222), outline=(66, 98, 154), radius=30)
    draw.text((132, 786), "LIVE BROKER DEMO", font=MONO_18, fill=CYAN)
    draw.rounded_rectangle((132, 824, 676, 914), radius=24, fill=WHITE)
    draw.text((190, 856), "OPEN LIVE BROKER DEMO", font=SANS_B_22, fill=INK)
    draw.text((132, 934), DEMO_URL, font=SANS_B_18, fill=CYAN)
    if QR.exists():
        rounded_card(draw, (1388, 674, 1718, 972), fill=(8, 13, 25, 232), outline=BLUE, radius=30)
        qr = Image.open(QR).convert("RGBA").resize((214, 214), Image.Resampling.LANCZOS)
        img.alpha_composite(qr, (1446, 712))
        draw.text((1492, 942), "SCAN DEMO", font=MONO_15, fill=CYAN)
    footer(draw, 7)
    return img


def add_transitions(pptx_path: Path) -> None:
    ns = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main"}
    ET.register_namespace("p", ns["p"])
    tmp = pptx_path.with_suffix(".tmp.pptx")
    with zipfile.ZipFile(pptx_path, "r") as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                root = ET.fromstring(data)
                for old in root.findall("p:transition", ns):
                    root.remove(old)
                transition = ET.Element(f"{{{ns['p']}}}transition", {"spd": "med", "advClick": "1"})
                ET.SubElement(transition, f"{{{ns['p']}}}fade")
                root.insert(1, transition)
                data = ET.tostring(root, encoding="utf-8", xml_declaration=True)
            zout.writestr(item, data)
    tmp.replace(pptx_path)


def ensure_video_posters() -> None:
    try:
        import cv2  # type: ignore
    except Exception:
        return

    DECK_MEDIA.mkdir(parents=True, exist_ok=True)
    targets = [
        (VALUATION_VIDEO, VALUATION_POSTER, 0.60),
        (WIDGET_VIDEO, WIDGET_POSTER, 0.08),
    ]
    for movie_path, poster_path, ratio in targets:
        if not movie_path.exists():
            continue
        cap = cv2.VideoCapture(str(movie_path))
        if not cap.isOpened():
            continue
        frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        index = max(0, min(frames - 1, int(frames * ratio)))
        cap.set(cv2.CAP_PROP_POS_FRAMES, index)
        ok, frame = cap.read()
        if ok:
            cv2.imwrite(str(poster_path), frame)
        cap.release()


def make_deck(slide_paths: list[Path]) -> Presentation:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    video_embeds = {
        4: {
            "movie": VALUATION_VIDEO,
            "poster": VALUATION_POSTER,
            "left": Inches(6.66),
            "top": Inches(2.26),
            "width": Inches(5.48),
            "height": Inches(3.08),
        },
        5: {
            "movie": WIDGET_VIDEO,
            "poster": WIDGET_POSTER,
            "left": Inches(6.66),
            "top": Inches(2.26),
            "width": Inches(5.48),
            "height": Inches(3.08),
        },
    }
    for idx, path in enumerate(slide_paths, 1):
        slide = prs.slides.add_slide(blank)
        slide.shapes.add_picture(str(path), 0, 0, width=SLIDE_W, height=SLIDE_H)
        if idx in video_embeds:
            spec = video_embeds[idx]
            movie_path = spec["movie"]
            poster_path = spec["poster"]
            if movie_path.exists() and poster_path.exists():
                slide.shapes.add_movie(
                    str(movie_path),
                    spec["left"],
                    spec["top"],
                    spec["width"],
                    spec["height"],
                    poster_frame_image=str(poster_path),
                    mime_type="video/mp4",
                )
        if idx == 7:
            link = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0.92), Inches(5.72), Inches(3.78), Inches(0.74))
            link.fill.solid()
            link.fill.fore_color.rgb = RGBColor(248, 250, 252)
            link.line.color.rgb = RGBColor(248, 250, 252)
            link.text_frame.clear()
            paragraph_shape = link.text_frame.paragraphs[0]
            paragraph_shape.alignment = PP_ALIGN.CENTER
            run = paragraph_shape.add_run()
            run.text = "OPEN LIVE BROKER DEMO"
            run.font.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(3, 5, 10)
            link.click_action.hyperlink.address = DEMO_URL
    return prs


def main() -> None:
    ensure_video_posters()
    tmpdir = Path(tempfile.gettempdir()) / "fonatprop_premium_deck"
    if tmpdir.exists():
        shutil.rmtree(tmpdir)
    tmpdir.mkdir(parents=True, exist_ok=True)

    slides = [slide_1(), slide_2(), slide_3(), slide_4(), slide_5(), slide_6(), slide_7()]
    slide_paths = []
    for idx, slide in enumerate(slides, 1):
        path = tmpdir / f"slide_{idx:02}.png"
        slide.convert("RGB").save(path, quality=96)
        slide_paths.append(path)

    outputs = [OUT_DESKTOP, OUT_DOWNLOADS, OUT_DATA_LAKE]
    for output in outputs:
        output.parent.mkdir(parents=True, exist_ok=True)
        deck = make_deck(slide_paths)
        deck.save(output)
        add_transitions(output)
        print(f"Saved {output}")


if __name__ == "__main__":
    main()
