from pathlib import Path

from django.conf import settings
from django.utils import timezone
from reportlab.lib import colors

BRAND_COLOR = colors.HexColor('#FF6600')
TOP_BOTTOM_BAR_HEIGHT = 28
FOOTER_MARGIN = 12


def add_branding_to_canvas(canvas, doc):
    """Draw brand rectangles and footer info on each PDF page."""
    width, height = doc.pagesize
    canvas.saveState()

    # Decorative bars
    canvas.setFillColor(BRAND_COLOR)
    canvas.rect(0, height - TOP_BOTTOM_BAR_HEIGHT, width, TOP_BOTTOM_BAR_HEIGHT, fill=1, stroke=0)
    canvas.rect(0, 0, width, TOP_BOTTOM_BAR_HEIGHT, fill=1, stroke=0)

    # Footer content above bottom bar
    footer_lines = [
        "☎ +504 9703-2263   |   +504 9449-1387     ✉ rotu_print3@yahoo.es",
        "📍 Siguatepeque, Barrio El Centro, Frente a Transportes ETUL"
    ]
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica-Bold', 9)

    line_height = 11
    start_y = TOP_BOTTOM_BAR_HEIGHT + FOOTER_MARGIN

    for index, line in enumerate(footer_lines):
        text_width = canvas.stringWidth(line, 'Helvetica-Bold', 9)
        x = (width - text_width) / 2
        y = start_y + index * line_height
        canvas.drawString(x, y, line)

    canvas.restoreState()
