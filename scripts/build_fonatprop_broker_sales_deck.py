from __future__ import annotations

import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUT_DESKTOP = Path.home() / "OneDrive" / "Desktop" / "FonatProp_Broker_Deck_PREMIUM.pptx"
OUT_DOWNLOADS = Path.home() / "Downloads" / "FonatProp_Broker_Deck_PREMIUM.pptx"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(3, 5, 10)
INK = RGBColor(246, 248, 252)
SOFT = RGBColor(184, 191, 205)
MUTED = RGBColor(117, 128, 148)
LINE = RGBColor(50, 68, 105)
BLUE = RGBColor(59, 130, 246)
CYAN = RGBColor(118, 196, 255)
GOLD = RGBColor(232, 193, 108)
CARD = RGBColor(7, 11, 21)

LOGO = ROOT / "public" / "brand" / "fonatprop-logo-nav.png"
MARK = ROOT / "public" / "brand" / "fonatprop-final-icon.png"
QR = ROOT / "public" / "brand" / "broker-demo-qr.png"
DEMO_URL = "https://fonatprop.com/broker-demo"

BACKGROUNDS = [
    ROOT / "public" / "dubai-slides" / "02-burj-khalifa.jpg",
    ROOT / "public" / "dubai-slides" / "01-marina-skyline.jpg",
    ROOT / "public" / "dubai-slides" / "04-marina-night.jpg",
    ROOT / "public" / "dubai-slides" / "07-marina-aerial.jpg",
    ROOT / "public" / "dubai-slides" / "03-burj-al-arab.jpg",
    ROOT / "public" / "dubai-slides" / "05-downtown-night.jpg",
]


def add_picture_cover(slide, image_path: Path, opacity_cover: int = 26) -> None:
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), 0, 0, width=SLIDE_W, height=SLIDE_H)

    # Layered overlays keep photos visible while preserving dark premium contrast.
    overlay = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    overlay.fill.solid()
    overlay.fill.fore_color.rgb = RGBColor(2, 4, 9)
    overlay.fill.transparency = opacity_cover
    overlay.line.fill.background()

    vignette = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    vignette.fill.solid()
    vignette.fill.fore_color.rgb = RGBColor(0, 0, 0)
    vignette.fill.transparency = 58
    vignette.line.fill.background()

    panel = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, Inches(7.2), SLIDE_H)
    panel.fill.solid()
    panel.fill.fore_color.rgb = RGBColor(0, 0, 0)
    panel.fill.transparency = 36
    panel.line.fill.background()


def add_logo(slide, x: float = 0.62, y: float = 0.36, w: float = 1.58) -> None:
    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(x), Inches(y), width=Inches(w))
    elif MARK.exists():
        slide.shapes.add_picture(str(MARK), Inches(x), Inches(y), width=Inches(0.46))


def textbox(slide, text: str, x: float, y: float, w: float, h: float):
    shape = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = shape.text_frame
    tf.clear()
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    return shape, tf, p


def label(slide, text: str, x: float, y: float, w: float = 4.8, color: RGBColor = CYAN) -> None:
    _, _, p = textbox(slide, text.upper(), x, y, w, 0.25)
    p.font.name = "Aptos"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = color
    p.font.letter_spacing = Pt(2.8)


def title(slide, first: str, second: str | None = None, x: float = 0.68, y: float = 1.34, w: float = 7.7) -> None:
    _, tf, p = textbox(slide, first, x, y, w, 1.18)
    p.font.name = "Georgia"
    p.font.size = Pt(48 if len(first) < 28 else 42)
    p.font.color.rgb = INK
    p.line_spacing = 0.9
    if second:
        p2 = tf.add_paragraph()
        p2.text = second
        p2.font.name = "Georgia"
        p2.font.size = Pt(44 if len(second) < 28 else 38)
        p2.font.italic = True
        p2.font.color.rgb = SOFT
        p2.line_spacing = 0.9


def body(slide, text: str, x: float, y: float, w: float, h: float = 0.9, size: int = 15, color: RGBColor = SOFT) -> None:
    _, _, p = textbox(slide, text, x, y, w, h)
    p.font.name = "Aptos"
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.line_spacing = 1.15


def line(slide, x: float, y: float, w: float = 1.05, color: RGBColor = BLUE) -> None:
    shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(0.025))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def glass_card(slide, x: float, y: float, w: float, h: float, border: RGBColor = LINE, fill: RGBColor = CARD):
    shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.fill.transparency = 8
    shape.line.color.rgb = border
    shape.line.transparency = 18
    return shape


def metric_card(slide, x: float, y: float, metric: str, caption: str, w: float = 1.85) -> None:
    glass_card(slide, x, y, w, 0.86)
    _, _, p = textbox(slide, metric, x + 0.18, y + 0.14, w - 0.36, 0.32)
    p.font.name = "Georgia"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = INK
    _, _, p = textbox(slide, caption.upper(), x + 0.18, y + 0.54, w - 0.36, 0.18)
    p.font.name = "Aptos"
    p.font.size = Pt(6.7)
    p.font.bold = True
    p.font.color.rgb = MUTED
    p.font.letter_spacing = Pt(1.2)


def bullet_panel(slide, eyebrow: str, bullets: list[str], x: float, y: float, w: float, h: float) -> None:
    glass_card(slide, x, y, w, h)
    label(slide, eyebrow, x + 0.32, y + 0.32, w - 0.64, BLUE)
    top = y + 0.84
    for i, item in enumerate(bullets):
        dot = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(x + 0.34), Inches(top + i * 0.62 + 0.08), Inches(0.08), Inches(0.08))
        dot.fill.solid()
        dot.fill.fore_color.rgb = BLUE if i == 0 else CYAN
        dot.line.fill.background()
        _, _, p = textbox(slide, item, x + 0.58, top + i * 0.62, w - 0.88, 0.34)
        p.font.name = "Aptos"
        p.font.size = Pt(13.6)
        p.font.color.rgb = INK if i == 0 else SOFT


def product_card(slide, x: float, y: float, title_text: str, description: str, tag: str) -> None:
    glass_card(slide, x, y, 5.72, 1.52, BLUE if tag == "PRIVATE" else GOLD)
    label(slide, tag, x + 0.28, y + 0.22, 2.0, GOLD if tag == "PUBLIC" else BLUE)
    _, _, p = textbox(slide, title_text, x + 0.28, y + 0.56, 4.95, 0.32)
    p.font.name = "Georgia"
    p.font.size = Pt(20)
    p.font.color.rgb = INK
    _, _, p = textbox(slide, description, x + 0.28, y + 0.94, 5.05, 0.38)
    p.font.name = "Aptos"
    p.font.size = Pt(11.8)
    p.font.color.rgb = SOFT


def pricing_card(slide, x: float, y: float, w: float, h: float, name: str, aed: str, usd: str, featured: bool = False) -> None:
    glass_card(slide, x, y, w, h, GOLD if featured else LINE, RGBColor(9, 14, 26))
    if featured:
        ribbon = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x + 0.28), Inches(y + 0.18), Inches(1.18), Inches(0.26))
        ribbon.fill.solid()
        ribbon.fill.fore_color.rgb = GOLD
        ribbon.line.fill.background()
        _, _, p = textbox(slide, "POPULAR", x + 0.42, y + 0.235, 0.82, 0.12)
        p.font.name = "Aptos"
        p.font.size = Pt(6.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(7, 10, 18)
        p.alignment = PP_ALIGN.CENTER
        name_y = y + 0.58
    else:
        name_y = y + 0.34

    _, _, p = textbox(slide, name, x + 0.26, name_y, w - 0.52, 0.38)
    p.font.name = "Aptos"
    p.font.size = Pt(12.4)
    p.font.bold = True
    p.font.color.rgb = SOFT
    p.alignment = PP_ALIGN.CENTER

    _, _, p = textbox(slide, aed, x + 0.18, y + 1.03, w - 0.36, 0.46)
    p.font.name = "Georgia"
    p.font.size = Pt(23 if len(aed) < 10 else 20)
    p.font.bold = True
    p.font.color.rgb = INK
    p.alignment = PP_ALIGN.CENTER

    _, _, p = textbox(slide, usd, x + 0.2, y + 1.56, w - 0.4, 0.22)
    p.font.name = "Aptos"
    p.font.size = Pt(9.5)
    p.font.color.rgb = MUTED
    p.alignment = PP_ALIGN.CENTER


def step_card(slide, i: int, x: float, title_text: str, copy: str) -> None:
    glass_card(slide, x, 4.35, 2.8, 1.28)
    label(slide, f"0{i}", x + 0.22, 4.58, 0.7, BLUE)
    _, _, p = textbox(slide, title_text, x + 0.64, 4.54, 1.9, 0.26)
    p.font.name = "Georgia"
    p.font.size = Pt(18)
    p.font.color.rgb = INK
    _, _, p = textbox(slide, copy, x + 0.24, 4.96, 2.26, 0.4)
    p.font.name = "Aptos"
    p.font.size = Pt(10.7)
    p.font.color.rgb = SOFT


def footer(slide, idx: int) -> None:
    _, _, p = textbox(slide, f"0{idx} / FONATPROP", 11.4, 7.05, 1.25, 0.16)
    p.font.name = "Aptos"
    p.font.size = Pt(7.2)
    p.font.color.rgb = MUTED
    p.alignment = PP_ALIGN.RIGHT


def add_slide_transition_xml(pptx_path: Path) -> None:
    """Add simple fade transitions by editing slide XML directly."""
    ns = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main"}
    ET.register_namespace("p", ns["p"])
    temp_path = pptx_path.with_suffix(".tmp.pptx")
    with zipfile.ZipFile(pptx_path, "r") as zin, zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as zout:
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
    temp_path.replace(pptx_path)


def make_deck() -> Presentation:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]

    # 1. Founder / product intro
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[0], 30)
    add_logo(slide)
    label(slide, "Founder intro", 0.68, 1.08)
    line(slide, 0.68, 1.4)
    title(slide, "Private AI valuations.", "Public lead capture.", y=1.55, w=8.3)
    body(
        slide,
        "Francisco Natale Oertly, 22, from Argentina. Building FonatProp for Dubai brokerages: a private valuation engine for agents and a public website widget that turns property curiosity into qualified conversations.",
        0.72,
        3.55,
        7.4,
        0.92,
        14,
    )
    metric_card(slide, 0.72, 5.08, "234K+", "Dubai transaction base")
    metric_card(slide, 2.92, 5.08, "AI", "agent valuation workflow")
    metric_card(slide, 5.12, 5.08, "1 script", "widget install")
    footer(slide, 1)

    # 2. Brokerage problem
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[1], 34)
    add_logo(slide)
    label(slide, "The problem", 0.68, 1.08)
    line(slide, 0.68, 1.4)
    title(slide, "Websites look premium.", "But they do not convert valuation demand.", y=1.55, w=8.2)
    body(
        slide,
        "Owners and buyers arrive with a valuable question: what is this property worth? If the website only says 'contact us', the agency loses timing, context and trust.",
        0.72,
        3.85,
        6.9,
        0.8,
        14,
    )
    bullet_panel(
        slide,
        "Business pain",
        [
            "High-intent visitors leave without a useful next step.",
            "Agents receive weak leads with no property context.",
            "Price conversations start without a data-backed anchor.",
            "Marketing spend creates traffic, but not enough qualified conversations.",
        ],
        8.05,
        1.32,
        4.58,
        3.82,
    )
    footer(slide, 2)

    # 3. FonatProp solution
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[2], 32)
    add_logo(slide)
    label(slide, "The solution", 0.68, 1.08)
    line(slide, 0.68, 1.4)
    title(slide, "Two tools.", "One brokerage revenue loop.", y=1.55, w=7.9)
    product_card(
        slide,
        0.72,
        4.1,
        "AI Valuation Workspace",
        "A private tool for the agency team. Agents use it internally for sharper price conversations.",
        "PRIVATE",
    )
    product_card(
        slide,
        6.85,
        4.1,
        "Lead Capture Widget",
        "A public website widget. It gives a broad range, captures intent and pushes the visitor to the agent.",
        "PUBLIC",
    )
    footer(slide, 3)

    # 4. Workflow
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[3], 32)
    add_logo(slide)
    label(slide, "How it works", 0.68, 1.08)
    line(slide, 0.68, 1.4)
    title(slide, "From visitor", "to qualified agent conversation.", y=1.55, w=8.1)
    body(slide, "The public experience is simple. The agency workflow behind it is where the value compounds.", 0.72, 3.5, 6.4, 0.45, 14)
    step_card(slide, 1, 0.72, "Capture", "Name, phone, email and valuation intent.")
    step_card(slide, 2, 3.78, "Qualify", "Address, bedrooms, area and property context.")
    step_card(slide, 3, 6.84, "Route", "Lead moves to WhatsApp, email or CRM.")
    step_card(slide, 4, 9.9, "Close", "Agent follows up using private AI valuation.")
    footer(slide, 4)

    # 5. Pricing only
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[4], 40)
    add_logo(slide)
    label(slide, "Pricing", 0.68, 0.92, color=GOLD)
    line(slide, 0.68, 1.22, 0.9, GOLD)
    title(slide, "Monthly plans", "in AED.", y=1.34, w=5.5)

    pricing_card(slide, 0.72, 3.05, 2.15, 2.0, "Lead Widget", "AED 1,099", "$299 / mo", True)
    pricing_card(slide, 3.12, 3.05, 1.68, 2.0, "10 uses", "AED 1,465", "$399 / mo")
    pricing_card(slide, 4.98, 3.05, 1.68, 2.0, "20 uses", "AED 2,199", "$599 / mo", True)
    pricing_card(slide, 6.84, 3.05, 1.68, 2.0, "50 uses", "AED 4,400", "$1,199 / mo")
    pricing_card(slide, 8.7, 3.05, 1.68, 2.0, "100 uses", "AED 7,345", "$2,000 / mo")
    pricing_card(slide, 10.56, 3.05, 1.68, 2.0, "200 uses", "AED 12,855", "$3,500 / mo")

    glass_card(slide, 0.72, 5.52, 11.5, 0.74, GOLD)
    body(
        slide,
        "Extra valuation credits available. Widget + AI valuation bundles available for agencies that want both lead capture and internal pricing intelligence.",
        1.02,
        5.77,
        10.9,
        0.26,
        12,
        INK,
    )
    footer(slide, 5)

    # 6. Live demo CTA
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, BACKGROUNDS[5], 30)
    add_logo(slide)
    label(slide, "Live demo", 0.68, 1.08)
    line(slide, 0.68, 1.4)
    title(slide, "Open the live broker demo.", "See the revenue loop.", y=1.55, w=8.0)
    body(
        slide,
        "Turn property curiosity into qualified brokerage conversations. The demo shows the widget, the private valuation positioning and the agent handoff.",
        0.72,
        3.55,
        6.7,
        0.75,
        14,
    )

    button = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.72), Inches(4.78), Inches(4.25), Inches(0.72))
    button.fill.solid()
    button.fill.fore_color.rgb = INK
    button.line.fill.background()
    button.click_action.hyperlink.address = DEMO_URL
    button.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = button.text_frame.paragraphs[0]
    p.text = "OPEN LIVE BROKER DEMO"
    p.font.name = "Aptos"
    p.font.size = Pt(12.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(5, 8, 15)
    p.alignment = PP_ALIGN.CENTER

    _, _, p = textbox(slide, DEMO_URL, 0.74, 5.72, 4.8, 0.26)
    p.font.name = "Aptos"
    p.font.size = Pt(11.5)
    p.font.color.rgb = CYAN
    p.font.underline = True
    p.alignment = PP_ALIGN.LEFT

    if QR.exists():
        glass_card(slide, 9.18, 3.65, 2.05, 2.25, BLUE)
        slide.shapes.add_picture(str(QR), Inches(9.5), Inches(3.9), width=Inches(1.4))
        label(slide, "Scan demo", 9.58, 5.47, 1.2)

    footer(slide, 6)
    return prs


def save_deck() -> None:
    OUT_DESKTOP.parent.mkdir(parents=True, exist_ok=True)
    OUT_DOWNLOADS.parent.mkdir(parents=True, exist_ok=True)
    deck = make_deck()
    deck.save(OUT_DESKTOP)
    add_slide_transition_xml(OUT_DESKTOP)
    deck.save(OUT_DOWNLOADS)
    add_slide_transition_xml(OUT_DOWNLOADS)
    print(f"Saved {OUT_DESKTOP}")
    print(f"Saved {OUT_DOWNLOADS}")


if __name__ == "__main__":
    save_deck()
