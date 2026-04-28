from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUT_DESKTOP = Path.home() / "OneDrive" / "Desktop" / "FonatProp_Broker_Sales_Deck_SHORT.pptx"
OUT_DOWNLOADS = Path.home() / "Downloads" / "FonatProp_Broker_Sales_Deck_SHORT.pptx"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(5, 7, 12)
WHITE = RGBColor(248, 250, 252)
MUTED = RGBColor(165, 172, 186)
DIM = RGBColor(95, 104, 122)
BLUE = RGBColor(59, 130, 246)
GOLD = RGBColor(226, 184, 91)

LOGO = ROOT / "public" / "brand" / "fonatprop-logo-nav.png"
MARK = ROOT / "public" / "brand" / "fonatprop-final-icon.png"
QR = ROOT / "public" / "brand" / "broker-demo-qr.png"

BACKGROUND_IMAGES = [
    ROOT / "public" / "dubai-slides" / "02-burj-khalifa.jpg",
    ROOT / "public" / "dubai-slides" / "01-marina-skyline.jpg",
    ROOT / "public" / "dubai-slides" / "04-marina-night.jpg",
    ROOT / "public" / "dubai-slides" / "07-marina-aerial.jpg",
    ROOT / "public" / "dubai-slides" / "03-burj-al-arab.jpg",
    ROOT / "public" / "dubai-slides" / "05-downtown-night.jpg",
]


def add_full_bg(slide, image_path: Path, dark: float = 0.56) -> None:
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG
    if image_path.exists():
        slide.shapes.add_picture(str(image_path), 0, 0, width=SLIDE_W, height=SLIDE_H)

    overlay = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    overlay.fill.solid()
    shade = int(255 * (1 - dark))
    overlay.fill.fore_color.rgb = RGBColor(shade // 12, shade // 10, shade // 8)
    overlay.fill.transparency = 18
    overlay.line.fill.background()

    left_grad = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, Inches(7.3), SLIDE_H)
    left_grad.fill.solid()
    left_grad.fill.fore_color.rgb = RGBColor(0, 0, 0)
    left_grad.fill.transparency = 22
    left_grad.line.fill.background()


def add_logo(slide) -> None:
    if LOGO.exists():
        slide.shapes.add_picture(str(LOGO), Inches(0.55), Inches(0.36), width=Inches(1.55))
    elif MARK.exists():
        slide.shapes.add_picture(str(MARK), Inches(0.55), Inches(0.34), width=Inches(0.48))


def add_label(slide, text: str, x: float, y: float, w: float = 5.8) -> None:
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(0.32))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = text.upper()
    p.font.name = "Aptos"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = BLUE
    p.font.letter_spacing = Pt(2)


def add_title(slide, lines: list[str], x: float = 0.68, y: float = 1.35, w: float = 7.2) -> None:
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(1.65))
    tf = box.text_frame
    tf.clear()
    tf.margin_left = 0
    tf.margin_right = 0
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line
        p.font.name = "Georgia"
        p.font.size = Pt(43 if len(line) < 32 else 38)
        p.font.color.rgb = WHITE if i == 0 else MUTED
        p.font.italic = i > 0
        p.line_spacing = 0.86


def add_body(slide, text: str, x: float, y: float, w: float, h: float = 1.0, size: int = 15) -> None:
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.name = "Aptos"
    p.font.size = Pt(size)
    p.font.color.rgb = MUTED
    p.line_spacing = 1.18


def add_card(slide, x: float, y: float, w: float, h: float, title: str, body: str, number: str | None = None) -> None:
    shape = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE,
        Inches(x),
        Inches(y),
        Inches(w),
        Inches(h),
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(8, 12, 22)
    shape.fill.transparency = 4
    shape.line.color.rgb = RGBColor(31, 44, 72)
    shape.line.transparency = 10

    if number:
        add_label(slide, number, x + 0.22, y + 0.18, 1.0)

    title_box = slide.shapes.add_textbox(Inches(x + 0.22), Inches(y + 0.48), Inches(w - 0.44), Inches(0.42))
    tf = title_box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = "Georgia"
    p.font.size = Pt(20)
    p.font.color.rgb = WHITE

    body_box = slide.shapes.add_textbox(Inches(x + 0.22), Inches(y + 1.05), Inches(w - 0.44), Inches(h - 1.16))
    tf = body_box.text_frame
    tf.clear()
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = body
    p.font.name = "Aptos"
    p.font.size = Pt(12.5)
    p.font.color.rgb = MUTED
    p.line_spacing = 1.12


def add_bullet_card(slide, title: str, bullets: list[str], x: float, y: float, w: float, h: float) -> None:
    shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = RGBColor(8, 12, 22)
    shape.fill.transparency = 2
    shape.line.color.rgb = RGBColor(42, 62, 98)

    add_label(slide, title, x + 0.3, y + 0.28, w - 0.6)
    box = slide.shapes.add_textbox(Inches(x + 0.36), Inches(y + 0.78), Inches(w - 0.72), Inches(h - 1.0))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    for i, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = bullet
        p.font.name = "Aptos"
        p.font.size = Pt(15)
        p.font.color.rgb = WHITE if i == 0 else MUTED
        p.level = 0
        p.space_after = Pt(10)


def add_footer(slide, idx: int) -> None:
    box = slide.shapes.add_textbox(Inches(11.6), Inches(7.02), Inches(1.2), Inches(0.2))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = f"0{idx} / FonatProp"
    p.font.name = "Aptos"
    p.font.size = Pt(7.5)
    p.font.color.rgb = DIM
    p.alignment = PP_ALIGN.RIGHT


def make_deck() -> Presentation:
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]

    # 1. Founder intro
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[0], 0.62)
    add_logo(slide)
    add_label(slide, "Founder intro", 0.68, 1.02)
    add_title(slide, ["FonatProp for", "Dubai brokerages"], y=1.42)
    add_body(
        slide,
        "Francisco Natale Oertly, 22, from Argentina. I am building an AI-powered real estate intelligence product for Dubai brokerages: a private valuation engine for agents plus a website widget that captures qualified valuation-intent leads.",
        0.72,
        3.4,
        7.15,
        1.25,
        14,
    )
    for x, metric, label in [
        (0.72, "234K+", "verified Dubai transactions"),
        (2.55, "AI", "valuation workflow"),
        (4.1, "1 script", "website widget install"),
    ]:
        add_card(slide, x, 5.15, 1.58, 0.9, metric, label)
    add_footer(slide, 1)

    # 2. Pain
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[1], 0.68)
    add_logo(slide)
    add_label(slide, "The problem", 0.68, 1.04)
    add_title(slide, ["Broker websites", "miss valuation demand"], y=1.44, w=7.8)
    add_body(
        slide,
        "Owners and buyers visit agency websites with one question: what is this property worth? Most websites answer with a contact form, so the lead leaves or asks another broker.",
        0.72,
        3.45,
        6.8,
        1.0,
        15,
    )
    add_bullet_card(
        slide,
        "Business pain",
        [
            "High-intent visitors are not captured at the right moment.",
            "Agents lose time on weak, unqualified conversations.",
            "Price discussions start without a data-backed anchor.",
            "The website looks good, but does not create enough sales conversations.",
        ],
        8.15,
        1.32,
        4.35,
        4.4,
    )
    add_footer(slide, 2)

    # 3. Solution
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[2], 0.66)
    add_logo(slide)
    add_label(slide, "The solution", 0.68, 1.04)
    add_title(slide, ["Private valuation.", "Public lead capture."], y=1.44, w=8.2)
    add_card(
        slide,
        0.72,
        4.05,
        5.15,
        1.75,
        "For the agency team",
        "A private AI valuation workflow trained on real Dubai transactions. Agents use it internally to advise with more confidence.",
        "01",
    )
    add_card(
        slide,
        6.25,
        4.05,
        5.15,
        1.75,
        "For the public website",
        "A broad-range widget that captures name, email, phone and property details, then pushes the visitor to WhatsApp or email.",
        "02",
    )
    add_footer(slide, 3)

    # 4. Workflow
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[3], 0.65)
    add_logo(slide)
    add_label(slide, "How it works", 0.68, 1.04)
    add_title(slide, ["From website visitor", "to agent conversation"], y=1.44, w=8.2)
    steps = [
        ("Capture", "Visitor leaves name, email and phone before seeing the estimate."),
        ("Qualify", "Widget asks address, bedrooms and area to understand the property intent."),
        ("Route", "Lead is sent to WhatsApp, email or CRM with the property context."),
        ("Close", "Agent uses the private valuation tool for the precise conversation."),
    ]
    for i, (title, body) in enumerate(steps):
        add_card(slide, 0.72 + i * 3.0, 4.25, 2.62, 1.45, title, body, f"0{i + 1}")
    add_footer(slide, 4)

    # 5. Pricing
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[4], 0.7)
    add_logo(slide)
    add_label(slide, "Commercial model", 0.68, 1.04)
    add_title(slide, ["Monthly plans", "with valuation tokens"], y=1.44, w=7.7)
    add_body(
        slide,
        "The tool is simple to sell: each agency pays a monthly subscription with a fixed number of valuation credits. If they need more, they buy extra credits or upgrade.",
        0.72,
        3.25,
        6.65,
        1.0,
        15,
    )
    plans = [
        ("Pilot", "$200 / month", "Widget + starter valuation credits for one website."),
        ("Growth", "$499 / month", "More valuation tokens, lead routing and usage tracking."),
        ("Agency", "Custom", "Multiple agents, higher volume and CRM delivery."),
    ]
    for i, (name, price, body) in enumerate(plans):
        add_card(slide, 0.72 + i * 4.05, 4.72, 3.48, 1.34, f"{name}  |  {price}", body)
    add_footer(slide, 5)

    # 6. CTA with link only
    slide = prs.slides.add_slide(blank)
    add_full_bg(slide, BACKGROUND_IMAGES[5], 0.62)
    add_logo(slide)
    add_label(slide, "Live demo", 0.68, 1.04)
    add_title(slide, ["Test the broker demo", "in one click"], y=1.44, w=7.7)
    add_body(
        slide,
        "A short pilot can show whether the agency website starts generating more qualified valuation-intent conversations.",
        0.72,
        3.2,
        6.4,
        0.8,
        15,
    )

    url = "https://fonatprop.com/broker-demo"
    button = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, Inches(0.72), Inches(4.35), Inches(4.4), Inches(0.72))
    button.fill.solid()
    button.fill.fore_color.rgb = WHITE
    button.line.fill.background()
    button.click_action.hyperlink.address = url
    tf = button.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = "OPEN LIVE BROKER DEMO"
    p.font.name = "Aptos"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = RGBColor(8, 12, 22)
    p.alignment = PP_ALIGN.CENTER

    link_box = slide.shapes.add_textbox(Inches(0.72), Inches(5.22), Inches(5.6), Inches(0.32))
    tf = link_box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.text = url
    p.font.name = "Aptos"
    p.font.size = Pt(13)
    p.font.color.rgb = BLUE
    p.font.underline = True
    p.alignment = PP_ALIGN.LEFT
    link_box.click_action.hyperlink.address = url

    if QR.exists():
        slide.shapes.add_picture(str(QR), Inches(9.42), Inches(3.72), width=Inches(1.55))
        add_body(slide, "Scan for demo", 9.28, 5.36, 1.9, 0.3, 10)

    add_bullet_card(
        slide,
        "Pilot ask",
        [
            "Install the widget on one brokerage website.",
            "Give agents access to the private valuation workflow.",
            "Measure qualified conversations and credit usage for 30 days.",
        ],
        7.2,
        1.35,
        4.95,
        2.1,
    )
    add_footer(slide, 6)

    return prs


if __name__ == "__main__":
    deck = make_deck()
    OUT_DESKTOP.parent.mkdir(parents=True, exist_ok=True)
    deck.save(OUT_DESKTOP)
    deck.save(OUT_DOWNLOADS)
    print(f"Saved {OUT_DESKTOP}")
    print(f"Saved {OUT_DOWNLOADS}")
