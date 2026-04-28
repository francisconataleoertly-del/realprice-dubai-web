from __future__ import annotations

import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from pptx import Presentation
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.util import Inches


ROOT = Path(__file__).resolve().parents[1]
OUT_DESKTOP = Path.home() / "OneDrive" / "Desktop" / "FonatProp_Broker_Deck_PREMIUM.pptx"
OUT_DOWNLOADS = Path.home() / "Downloads" / "FonatProp_Broker_Deck_PREMIUM.pptx"
DEMO_URL = "https://fonatprop.com/broker-demo"

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

LOGO = ROOT / "public" / "brand" / "fonatprop-logo-nav.png"
MARK = ROOT / "public" / "brand" / "fonatprop-final-icon.png"
QR = ROOT / "public" / "brand" / "broker-demo-qr.png"

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
    img = ImageEnhance.Brightness(img).enhance(0.98)
    img = ImageEnhance.Contrast(img).enhance(1.15)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, dark))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    # Soft left readability gradient, without killing the photo.
    grad = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(grad)
    for x in range(W):
        alpha = int(max(0, 150 * (1 - x / 1120)))
        draw.line((x, 0, x, H), fill=alpha)
    left = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    left.putalpha(grad)
    img = Image.alpha_composite(img, left)

    # Vignette border.
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    for i in range(220):
        alpha = int((i / 220) ** 2 * 160)
        vd.rectangle((i, i, W - i, H - i), outline=alpha)
    black = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    black.putalpha(vignette.filter(ImageFilter.GaussianBlur(28)))
    return Image.alpha_composite(img, black)


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
    draw.text((x1 + 28, y1 + 28), number, font=MONO_18, fill=BLUE)
    draw.text((x1 + 78, y1 + 22), title_text, font=SERIF_56, fill=WHITE)
    paragraph(draw, copy, x1 + 28, y1 + 92, x2 - x1 - 56, SANS_20, SOFT, 8)


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
    label(draw, "Founder intro", 96, 210)
    draw.text((96, 282), "Private AI valuations.", font=SERIF_88, fill=WHITE)
    draw.text((96, 382), "Public lead capture.", font=SERIF_I_76, fill=SOFT)
    paragraph(
        draw,
        "Francisco Natale Oertly, 22, from Argentina. Building FonatProp for Dubai brokerages: a private valuation engine for agents and a public website widget that turns property curiosity into qualified conversations.",
        100,
        520,
        930,
        SANS_28,
        SOFT,
        12,
    )
    metric(draw, (100, 770, 388, 918), "234K+", "Dubai transactions")
    metric(draw, (428, 770, 716, 918), "AI", "agent valuation")
    metric(draw, (756, 770, 1044, 918), "1 script", "widget install")
    footer(draw, 1)
    return img


def slide_2() -> Image.Image:
    img = premium_bg(BG_IMAGES[1], 72)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "The problem", 96, 214)
    draw.text((96, 292), "Premium websites.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "Weak conversion.", font=SERIF_I_76, fill=SOFT)
    paragraph(
        draw,
        "Owners and buyers arrive with a valuable question: what is this property worth? If the website only says 'contact us', the agency loses timing, context and trust.",
        100,
        548,
        900,
        SANS_28,
        SOFT,
        12,
    )
    bullet_panel(
        draw,
        (1180, 210, 1792, 795),
        "Business pain",
        [
            "High-intent visitors leave without a useful next step.",
            "Agents receive weak leads with no property context.",
            "Price conversations start without a data-backed anchor.",
            "Marketing spend creates traffic, but not enough qualified conversations.",
        ],
    )
    footer(draw, 2)
    return img


def slide_3() -> Image.Image:
    img = premium_bg(BG_IMAGES[2], 76)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "The solution", 96, 214)
    draw.text((96, 292), "Two tools.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "One revenue loop.", font=SERIF_I_76, fill=SOFT)
    product_card(
        draw,
        (100, 648, 900, 880),
        "Private",
        "AI Valuation Workspace",
        "For the agency team. Agents use it internally for sharper price conversations, not as a public toy.",
        BLUE,
    )
    product_card(
        draw,
        (980, 648, 1780, 880),
        "Public",
        "Lead Capture Widget",
        "For the agency website. Broad range, captured intent and a direct handoff to the agent.",
        GOLD,
    )
    footer(draw, 3)
    return img


def slide_4() -> Image.Image:
    img = premium_bg(BG_IMAGES[3], 76)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "How it works", 96, 214)
    draw.text((96, 292), "From visitor", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "to agent conversation.", font=SERIF_I_76, fill=SOFT)
    paragraph(draw, "The public experience captures the opportunity. The private AI workflow helps the agent close with confidence.", 100, 540, 820, SANS_28, SOFT, 12)
    xs = [100, 545, 990, 1435]
    steps = [
        ("01", "Capture", "Name, phone, email and valuation intent."),
        ("02", "Qualify", "Address, bedrooms, area and property context."),
        ("03", "Route", "Lead moves to WhatsApp, email or CRM."),
        ("04", "Close", "Agent follows up using private AI valuation."),
    ]
    for x, step in zip(xs, steps):
        step_card(draw, (x, 728, x + 350, 928), *step)
    footer(draw, 4)
    return img


def slide_5() -> Image.Image:
    img = premium_bg(BG_IMAGES[4], 78)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Pricing", 96, 174, GOLD)
    draw.text((96, 250), "Monthly plans", font=SERIF_78, fill=WHITE)
    draw.text((96, 340), "in AED.", font=SERIF_I_58, fill=SOFT)

    # Feature the widget separately, then keep AI valuation tokens in a readable grid.
    pricing_card(draw, (100, 510, 470, 805), "Lead Widget", "AED 1,099", "$299 / mo", GOLD, True)
    draw.text((118, 828), "Public lead capture for one brokerage website.", font=SANS_20, fill=SOFT)

    token_cards = [
        ((560, 392, 880, 642), "10 uses", "AED 1,465", "$399 / mo", BLUE, False),
        ((925, 392, 1245, 642), "20 uses", "AED 2,199", "$599 / mo", GOLD, True),
        ((1290, 392, 1610, 642), "50 uses", "AED 4,400", "$1,199 / mo", BLUE, False),
        ((742, 690, 1062, 940), "100 uses", "AED 7,345", "$2,000 / mo", BLUE, False),
        ((1108, 690, 1428, 940), "200 uses", "AED 12.8K", "$3,500 / mo", BLUE, False),
    ]
    for args in token_cards:
        pricing_card(draw, *args)

    rounded_card(draw, (100, 940, 1820, 1016), fill=(8, 13, 25, 230), outline=GOLD, radius=22)
    draw.text(
        (135, 964),
        "Extra valuation credits available. Widget + AI valuation bundles available.",
        font=SANS_B_28,
        fill=WHITE,
    )
    footer(draw, 5)
    return img


def slide_6() -> Image.Image:
    img = premium_bg(BG_IMAGES[5], 74)
    draw = ImageDraw.Draw(img)
    paste_logo(img)
    label(draw, "Live demo", 96, 214)
    draw.text((96, 292), "Open the broker demo.", font=SERIF_88, fill=WHITE)
    draw.text((96, 392), "See the revenue loop.", font=SERIF_I_76, fill=SOFT)
    paragraph(
        draw,
        "Turn property curiosity into qualified brokerage conversations. The demo shows the widget, the private valuation positioning and the agent handoff.",
        100,
        550,
        930,
        SANS_28,
        SOFT,
        12,
    )
    draw.rounded_rectangle((100, 750, 650, 842), radius=22, fill=WHITE)
    draw.text((162, 780), "OPEN LIVE BROKER DEMO", font=SANS_B_22, fill=INK)
    draw.text((100, 880), DEMO_URL, font=SANS_B_22, fill=CYAN)
    if QR.exists():
        rounded_card(draw, (1425, 590, 1695, 895), fill=(8, 13, 25, 230), outline=BLUE, radius=28)
        qr = Image.open(QR).convert("RGBA").resize((210, 210), Image.Resampling.LANCZOS)
        img.alpha_composite(qr, (1455, 625))
        draw.text((1488, 852), "SCAN DEMO", font=MONO_18, fill=CYAN)
    footer(draw, 6)
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


def make_deck(slide_paths: list[Path]) -> Presentation:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    for idx, path in enumerate(slide_paths, 1):
        slide = prs.slides.add_slide(blank)
        slide.shapes.add_picture(str(path), 0, 0, width=SLIDE_W, height=SLIDE_H)
        if idx == 6:
            link = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0.68), Inches(5.18), Inches(3.82), Inches(0.64))
            link.fill.transparency = 100
            link.line.fill.background()
            link.click_action.hyperlink.address = DEMO_URL
    return prs


def main() -> None:
    tmpdir = Path(tempfile.gettempdir()) / "fonatprop_premium_deck"
    if tmpdir.exists():
        shutil.rmtree(tmpdir)
    tmpdir.mkdir(parents=True, exist_ok=True)

    slides = [slide_1(), slide_2(), slide_3(), slide_4(), slide_5(), slide_6()]
    slide_paths = []
    for idx, slide in enumerate(slides, 1):
        path = tmpdir / f"slide_{idx:02}.png"
        slide.convert("RGB").save(path, quality=96)
        slide_paths.append(path)

    OUT_DESKTOP.parent.mkdir(parents=True, exist_ok=True)
    OUT_DOWNLOADS.parent.mkdir(parents=True, exist_ok=True)
    deck = make_deck(slide_paths)
    deck.save(OUT_DESKTOP)
    add_transitions(OUT_DESKTOP)
    deck.save(OUT_DOWNLOADS)
    add_transitions(OUT_DOWNLOADS)
    print(f"Saved {OUT_DESKTOP}")
    print(f"Saved {OUT_DOWNLOADS}")


if __name__ == "__main__":
    main()
