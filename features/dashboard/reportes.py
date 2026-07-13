"""Generación del reporte PDF mensual de defensas — UPEL Mesa Manager."""

import io
import os
from datetime import date

from reportlab.graphics import renderPDF
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import Paragraph, Table, TableStyle

from features.dashboard.models import DefensaReporte, KPIs

# ── Rutas de recursos ─────────────────────────────────────────────────────────
_ROOT     = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_LOGO     = os.path.join(_ROOT, "public", "logo_upel.png")

# ── Fuente estilizada para el título (Arial Black en Windows) ─────────────────
try:
    pdfmetrics.registerFont(TTFont("TituloFont", "C:/Windows/Fonts/ariblk.ttf"))
    _TITULO = "TituloFont"
except Exception:
    _TITULO = "Helvetica-Bold"

# ── Paleta del proyecto UPEL ──────────────────────────────────────────────────
_NAVY     = HexColor("#00072d")
_BLUE     = HexColor("#1E3A5F")
_BLUE_MID = HexColor("#0a2472")
_ACCENT   = HexColor("#7EB3FF")
_MUTED    = HexColor("#8DA4C0")
_BORDER   = HexColor("#E2E8F0")
_GRAY_ROW = HexColor("#F0F5FF")
_AMBER    = HexColor("#92400E")
_AMBER_BG = HexColor("#FFFBEB")
_GREEN    = HexColor("#065F46")
_RED      = HexColor("#DC2626")
_RED_BG   = HexColor("#FEF2F2")

_PW, _PH = A4           # portrait  595.27 × 841.89
_LW, _LH = _PH, _PW    # landscape 841.89 × 595.27
_M = 25                 # margen lateral reducido para acomodar 11 columnas

_ESTADO_LABEL = {
    "Aprobada":         "Aprobado",
    "Con_Correcciones": "Con Correcciones",
    "Reprobada":        "Reprobado",
}

# 11 columnas — suma 792 pts (= 841.89 − 2×25). Cédula reemplazada por Maestría.
_COL_WIDTHS = [52, 84, 136, 50, 34, 60, 76, 76, 76, 70, 78]
_HEADERS    = [
    "ID", "Estudiante", "Título del Proyecto",
    "Fecha", "Hora", "Aula", "Tutor", "Jurado 1", "Jurado 2", "Veredicto", "Maestría",
]

# Estilo para celdas con wrap automático de texto largo
_CELL_STYLE = ParagraphStyle(
    "cell",
    fontName="Helvetica",
    fontSize=6.5,
    leading=9,
)


# ── Utilidades ────────────────────────────────────────────────────────────────

def _rgba(r: int, g: int, b: int, a: float) -> Color:
    return Color(r / 255, g / 255, b / 255, alpha=a)


def _truncar(texto: str, limite: int) -> str:
    return (texto[:limite] + "…") if len(texto) > limite else texto


# ── Página 1: Portada (A4 portrait) ──────────────────────────────────────────

def _portada(
    c: pdf_canvas.Canvas,
    mes: str,
    anio: int,
    maestria: str | None,
    usuario: str,
) -> None:
    W, H = _PW, _PH

    # Fondo oscuro
    c.setFillColor(_NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Círculos decorativos — esquina superior derecha
    c.setFillColor(_rgba(30, 58, 95, 0.50))
    c.circle(W + 25, H + 15, 230, fill=1, stroke=0)
    c.setFillColor(_rgba(10, 36, 114, 0.30))
    c.circle(W - 35, H - 65, 158, fill=1, stroke=0)

    # Círculos decorativos — esquina inferior izquierda
    c.setFillColor(_rgba(30, 58, 95, 0.45))
    c.circle(-28, -18, 215, fill=1, stroke=0)
    c.setFillColor(_rgba(10, 36, 114, 0.28))
    c.circle(55, 72, 138, fill=1, stroke=0)

    # Logo UPEL centrado arriba
    if os.path.exists(_LOGO):
        try:
            img   = ImageReader(_LOGO)
            iw, ih = img.getSize()
            logo_h = 58
            logo_w = iw * (logo_h / ih)
            c.drawImage(_LOGO, (W - logo_w) / 2, H - 80, width=logo_w, height=logo_h, mask="auto")
        except Exception:
            pass

    # Institución
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W / 2, H - 100, "Universidad Pedagógica Experimental Libertador")
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 9)
    c.drawCentredString(W / 2, H - 115, "Vicerrectorado de Investigación y Postgrado")

    # Badge mes / año
    bw, bh = 168, 30
    c.setFillColor(_BLUE)
    c.roundRect((W - bw) / 2, H - 210, bw, bh, 15, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, H - 201, f"{mes}  /  {anio}")

    # Título principal — fuente estilizada
    c.setFillColor(colors.white)
    c.setFont(_TITULO, 46)
    c.drawCentredString(W / 2, H - 304, "Reporte de")

    c.setFillColor(_ACCENT)
    c.setFont(_TITULO, 46)
    c.drawCentredString(W / 2, H - 362, "defensas")

    c.setFillColor(colors.white)
    c.setFont(_TITULO, 46)
    c.drawCentredString(W / 2, H - 420, "mensual")

    # Separador
    c.setStrokeColor(_BLUE)
    c.setLineWidth(1)
    c.line(W / 2 - 95, H - 448, W / 2 + 95, H - 448)

    # Maestría
    if maestria:
        c.setFillColor(_MUTED)
        c.setFont("Helvetica", 11)
        c.drawCentredString(W / 2, H - 472, maestria)

    # Footer
    c.setStrokeColor(_BLUE)
    c.setLineWidth(0.5)
    c.line(_M, 158, W - _M, 158)

    c.setFillColor(_MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(_M, 138, "GENERADO POR")

    c.setFillColor(colors.white)
    c.setFont("Helvetica", 13)
    c.drawString(_M, 118, usuario)

    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(_M, 96, f"Fecha de generación: {date.today().strftime('%d/%m/%Y')}")


# ── Página 2: Resumen ejecutivo (A4 portrait) ─────────────────────────────────

def _pie_chart(aprobadas: int, con_corr: int, reprobadas: int) -> Drawing:
    datos, fills = [], []
    if aprobadas > 0:
        datos.append(aprobadas);  fills.append(_BLUE)
    if con_corr > 0:
        datos.append(con_corr);   fills.append(HexColor("#D97706"))
    if reprobadas > 0:
        datos.append(reprobadas); fills.append(_RED)

    d = Drawing(220, 190)
    if not datos:
        return d

    total = sum(datos)
    pie = Pie()
    pie.x, pie.y   = 45, 20
    pie.width = pie.height = 150
    pie.data   = datos
    pie.labels = [f"{round(v / total * 100)}%" for v in datos]
    pie.simpleLabels    = True
    pie.slices.strokeWidth  = 1
    pie.slices.strokeColor  = colors.white
    pie.slices.fontName     = "Helvetica-Bold"
    pie.slices.fontSize     = 9
    pie.slices.labelRadius  = 0.65
    pie.slices.fontColor    = colors.white
    for i, color in enumerate(fills):
        pie.slices[i].fillColor = color

    d.add(pie)
    return d


def _resumen(
    c: pdf_canvas.Canvas,
    kpis: KPIs,
    defensas: list[DefensaReciente],
    mes: str,
    anio: int,
) -> None:
    W, H = _PW, _PH

    c.setFillColor(colors.white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Header strip
    c.setFillColor(_NAVY)
    c.rect(0, H - 90, W, 90, fill=1, stroke=0)
    c.setFillColor(_BLUE)
    c.rect(0, H - 93, W, 3, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(W / 2, H - 50, "Resumen Ejecutivo")
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 10)
    c.drawCentredString(W / 2, H - 68, f"Mesas de Defensa · {mes} {anio}")

    aprobadas  = sum(1 for d in defensas if d.estado == "Aprobada")
    con_corr   = sum(1 for d in defensas if d.estado == "Con_Correcciones")
    reprobadas = sum(1 for d in defensas if d.estado == "Reprobada")
    total      = len(defensas)

    # ── Fila 1: 2 tarjetas grandes ────────────────────────────────────────────
    cw1, ch1 = 210, 92
    row1_y = H - 90 - 28 - ch1      # = H - 210

    for i, (val, label) in enumerate([
        (str(total),                 "Total Defensas del Mes"),
        (f"{kpis.tasa_aprobacion}%", "Tasa de Aprobación"),
    ]):
        cx = (W - 2 * cw1 - 18) / 2 + i * (cw1 + 18)
        c.setFillColor(colors.white)
        c.setStrokeColor(_BLUE)
        c.setLineWidth(1.5)
        c.roundRect(cx, row1_y, cw1, ch1, 8, fill=1, stroke=1)
        c.setFillColor(_NAVY)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(cx + cw1 / 2, row1_y + ch1 - 46, val)
        c.setFillColor(_MUTED)
        c.setFont("Helvetica", 9)
        c.drawCentredString(cx + cw1 / 2, row1_y + 18, label)

    # ── Fila 2: 3 tarjetas pequeñas ──────────────────────────────────────────
    cw2, ch2 = 130, 76
    row2_y = row1_y - 20 - ch2

    card_data = [
        (aprobadas,  "Aprobadas",        _GREEN,              HexColor("#EFF6FF"), _BLUE),
        (con_corr,   "Con Correcciones", HexColor("#D97706"), _AMBER_BG,           HexColor("#D97706")),
        (reprobadas, "Reprobadas",       _RED,                _RED_BG,             _RED),
    ]
    total_w2 = 3 * cw2 + 2 * 18
    for i, (val, label, txt_c, bg_c, border_c) in enumerate(card_data):
        cx2 = (W - total_w2) / 2 + i * (cw2 + 18)
        c.setFillColor(bg_c)
        c.setStrokeColor(border_c)
        c.setLineWidth(1)
        c.roundRect(cx2, row2_y, cw2, ch2, 8, fill=1, stroke=1)
        c.setFillColor(txt_c)
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(cx2 + cw2 / 2, row2_y + ch2 - 38, str(val))
        c.setFillColor(HexColor("#64748B"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(cx2 + cw2 / 2, row2_y + 15, label)

    # ── Gráfico de torta ──────────────────────────────────────────────────────
    pie_title_y = row2_y - 38
    c.setFillColor(_NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W / 2, pie_title_y, "Distribución de Resultados")

    c.setStrokeColor(_BORDER)
    c.setLineWidth(0.5)
    c.line(_M, pie_title_y - 14, W - _M, pie_title_y - 14)

    # Leyenda colores
    legend_y = pie_title_y - 36
    legend_items = []
    if aprobadas > 0:
        legend_items.append((_BLUE,             "Aprobadas"))
    if con_corr > 0:
        legend_items.append((HexColor("#D97706"), "Con Correcciones"))
    if reprobadas > 0:
        legend_items.append((_RED,               "Reprobadas"))

    box_sz = 9
    item_w = 110
    total_leg_w = len(legend_items) * item_w
    leg_x = (W - total_leg_w) / 2
    for j, (col, lbl) in enumerate(legend_items):
        lx = leg_x + j * item_w
        c.setFillColor(col)
        c.roundRect(lx, legend_y, box_sz, box_sz, 2, fill=1, stroke=0)
        c.setFillColor(HexColor("#374151"))
        c.setFont("Helvetica", 8)
        c.drawString(lx + box_sz + 4, legend_y + 1, lbl)

    if total > 0:
        drawing = _pie_chart(aprobadas, con_corr, reprobadas)
        renderPDF.draw(drawing, c, (W - 220) / 2, legend_y - 220)

    # Footer
    c.setStrokeColor(_BORDER)
    c.setLineWidth(0.5)
    c.line(_M, 38, W - _M, 38)
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 24, f"UPEL · Reporte {mes} {anio} · {date.today().strftime('%d/%m/%Y')}")


# ── Páginas 3+: Tabla (A4 landscape) ─────────────────────────────────────────

def _tabla_page_header(c: pdf_canvas.Canvas, mes: str, anio: int, pag: int, total: int) -> None:
    W, H = _LW, _LH
    c.setFillColor(_NAVY)
    c.rect(0, H - 62, W, 62, fill=1, stroke=0)
    c.setFillColor(_BLUE)
    c.rect(0, H - 65, W, 3, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(_M, H - 33, "Detalle de Defensas Concluidas")
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(_M, H - 49, f"Universidad Pedagógica Experimental Libertador · {mes} {anio}")
    c.drawRightString(W - _M, H - 41, f"Pág. {pag} / {total}")


def _tabla_page_footer(c: pdf_canvas.Canvas, mes: str, anio: int) -> None:
    W, H = _LW, _LH
    c.setStrokeColor(_BORDER)
    c.setLineWidth(0.5)
    c.line(_M, 32, W - _M, 32)
    c.setFillColor(_MUTED)
    c.setFont("Helvetica", 8)
    c.drawCentredString(W / 2, 18, f"UPEL · Vicerrectorado de Investigación y Postgrado · {mes} {anio}")


def _build_table_style(slice_defensas: list[DefensaReporte]) -> TableStyle:
    style = TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  _NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  7),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 6.5),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, _GRAY_ROW]),
        ("GRID",          (0, 0), (-1, -1), 0.4, HexColor("#D1D5DB")),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
    ])
    for i, d in enumerate(slice_defensas, start=1):
        if d.estado == "Con_Correcciones":
            style.add("BACKGROUND", (0, i), (-1, i), _AMBER_BG)
            style.add("TEXTCOLOR",  (-1, i), (-1, i), _AMBER)
            style.add("FONTNAME",   (-1, i), (-1, i), "Helvetica-Bold")
        elif d.estado == "Reprobada":
            style.add("BACKGROUND", (0, i), (-1, i), _RED_BG)
            style.add("TEXTCOLOR",  (-1, i), (-1, i), _RED)
            style.add("FONTNAME",   (-1, i), (-1, i), "Helvetica-Bold")
        elif d.estado == "Aprobada":
            style.add("TEXTCOLOR",  (-1, i), (-1, i), _GREEN)
            style.add("FONTNAME",   (-1, i), (-1, i), "Helvetica-Bold")
    return style


def _paginas_tabla(
    c: pdf_canvas.Canvas,
    defensas: list[DefensaReporte],
    mes: str,
    anio: int,
) -> None:
    W, H = _LW, _LH
    avail_w = W - 2 * _M
    top_used = 65 + 16   # header strip + padding
    bot_used = 50
    avail_h  = H - top_used - bot_used

    rows_per_page = max(1, int(avail_h / 15))  # ~15 pts por fila
    chunks = [defensas[i:i + rows_per_page] for i in range(0, max(len(defensas), 1), rows_per_page)]
    total_pags = len(chunks)

    for idx, chunk in enumerate(chunks):
        if idx > 0:
            c.showPage()
            c.setPageSize((_LW, _LH))

        _tabla_page_header(c, mes, anio, idx + 1, total_pags)

        def _p(texto: str) -> Paragraph:
            return Paragraph(texto or "—", _CELL_STYLE)

        data_rows = [
            [
                f"DEF-{str(d.id).zfill(4)}",
                _p(d.estudiante),
                _p(d.titulo),
                d.fecha,
                d.hora_inicio,
                _p(d.aula),
                _p(d.tutor),
                _p(d.jurado1),
                _p(d.jurado2),
                _ESTADO_LABEL.get(d.estado, d.estado),
                _p(d.maestria),
            ]
            for d in chunk
        ]

        tabla = Table([_HEADERS] + data_rows, colWidths=_COL_WIDTHS)
        tabla.setStyle(_build_table_style(chunk))
        _, tbl_h = tabla.wrapOn(c, avail_w, avail_h)
        tabla.drawOn(c, _M, H - top_used - tbl_h)

        _tabla_page_footer(c, mes, anio)


# ── Punto de entrada ──────────────────────────────────────────────────────────

def generar_pdf(
    defensas: list[DefensaReporte],
    kpis:     KPIs,
    mes:      str,
    anio:     int,
    maestria: str | None,
    usuario:  str,
) -> bytes:
    buf = io.BytesIO()
    c   = pdf_canvas.Canvas(buf, pagesize=A4)

    _portada(c, mes, anio, maestria, usuario)
    c.showPage()

    _resumen(c, kpis, defensas, mes, anio)
    c.showPage()

    c.setPageSize((_LW, _LH))
    _paginas_tabla(c, defensas, mes, anio)

    c.save()
    return buf.getvalue()
