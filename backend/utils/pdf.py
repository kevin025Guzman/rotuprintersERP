from reportlab.lib import colors

BRAND_COLOR = colors.HexColor('#FF6600')
TOP_BOTTOM_BAR_HEIGHT = 28


def add_branding_to_canvas(canvas, doc):
    """Draw brand rectangles and footer info on each PDF page."""
    width, height = doc.pagesize
    canvas.saveState()

    # Decorative bars
    canvas.setFillColor(BRAND_COLOR)
    canvas.rect(0, height - TOP_BOTTOM_BAR_HEIGHT, width, TOP_BOTTOM_BAR_HEIGHT, fill=1, stroke=0)
    canvas.rect(0, 0, width, TOP_BOTTOM_BAR_HEIGHT, fill=1, stroke=0)

    # Footer content
    footer_lines = [
        "☎ +504 9703-2263   |   +504 9449-1387     ✉ rotu_print3@yahoo.es",
        "📍 Siguatepeque, Barrio El Centro, Frente a Transportes ETUL"
    ]
    canvas.setFillColor(colors.white)
    canvas.setFont('Helvetica-Bold', 9)

    line_height = 11
    start_y = (TOP_BOTTOM_BAR_HEIGHT - line_height * len(footer_lines)) / 2 + 2

    for index, line in enumerate(footer_lines):
        text_width = canvas.stringWidth(line, 'Helvetica-Bold', 9)
        x = (width - text_width) / 2
        y = start_y + (len(footer_lines) - index - 1) * line_height + 4
        canvas.drawString(x, y, line)

    canvas.restoreState()
