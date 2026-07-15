"""Render an audit as a PDF using ReportLab."""
import io
from html import escape
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)


def _safe(text):
    """Escape user/AI text so ReportLab's Paragraph parser won't choke on HTML-like content."""
    if text is None:
        return ""
    return escape(str(text), quote=False)


FOREST = colors.HexColor("#2D3E32")
TERRA = colors.HexColor("#E07A5F")
SAGE = colors.HexColor("#81B29A")
WARM = colors.HexColor("#E6A57E")
BG = colors.HexColor("#FDFBF7")
BORDER = colors.HexColor("#E5E0D8")
TEXT = colors.HexColor("#1A201A")
MUTED = colors.HexColor("#5C685C")


def _score_color(score: int):
    if score >= 75:
        return SAGE
    if score >= 50:
        return WARM
    return TERRA


def build_audit_pdf(audit: dict) -> bytes:
    result = audit.get("result", {})
    ai = audit.get("ai_recommendations") or {}

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=0.7*inch, rightMargin=0.7*inch,
        topMargin=0.7*inch, bottomMargin=0.7*inch,
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=FOREST, fontSize=22, leading=26, spaceAfter=4)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=FOREST, fontSize=14, leading=18, spaceBefore=14, spaceAfter=6)
    body = ParagraphStyle("body", parent=styles["BodyText"], textColor=TEXT, fontSize=10, leading=14)
    muted = ParagraphStyle("muted", parent=styles["BodyText"], textColor=MUTED, fontSize=9, leading=12)
    eyebrow = ParagraphStyle("eyebrow", parent=styles["BodyText"], textColor=MUTED, fontSize=8, leading=10, spaceAfter=2)

    flow = []

    # --- Cover ---
    flow.append(Paragraph("GOODLY", eyebrow))
    flow.append(Paragraph("SEO Audit Report", h1))
    flow.append(Paragraph(_safe(result.get("url", "")), muted))
    flow.append(Spacer(1, 0.2 * inch))

    overall = result.get("overall_score", 0) or 0
    score_cell = Paragraph(
        f"<font size=40 color='{_score_color(overall).hexval()}'><b>{overall}</b></font>"
        f"<font size=10 color='{MUTED.hexval()}'> / 100</font>",
        body,
    )
    meta_lines = (
        f"<b>Generated:</b> {datetime.now().strftime('%b %d, %Y %H:%M')}<br/>"
        f"<b>Load time:</b> {result.get('load_time_ms', 0)} ms<br/>"
        f"<b>Status code:</b> {_safe(result.get('status_code', '—'))}<br/>"
        f"<b>Total issues:</b> {len(result.get('issues') or [])}"
    )
    cover_table = Table(
        [[score_cell, Paragraph(meta_lines, body)]],
        colWidths=[2.2 * inch, 4.6 * inch],
    )
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG),
        ("BOX", (0, 0), (-1, -1), 1, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
    ]))
    flow.append(cover_table)

    if ai.get("summary"):
        flow.append(Paragraph("Summary", h2))
        flow.append(Paragraph(_safe(ai["summary"]), body))

    # --- Category scores ---
    flow.append(Paragraph("Category Scores", h2))
    cats = result.get("categories") or {}
    cat_rows = [[
        Paragraph("<b>Category</b>", body),
        Paragraph("<b>Score</b>", body),
        Paragraph("<b>Rating</b>", body),
    ]]
    for k in ["meta_tags", "headings", "performance", "mobile", "accessibility", "content", "social", "security"]:
        score = cats.get(k, 0)
        rating = "Good" if score >= 75 else ("Average" if score >= 50 else "Needs work")
        cat_rows.append([
            Paragraph(k.replace("_", " ").title(), body),
            Paragraph(f"<font color='{_score_color(score).hexval()}'><b>{score}/100</b></font>", body),
            Paragraph(rating, muted),
        ])
    cat_table = Table(cat_rows, colWidths=[2.3 * inch, 1.6 * inch, 2.9 * inch])
    cat_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 1, BORDER),
        ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    flow.append(cat_table)

    # --- AI Priority Actions ---
    if ai.get("priority_actions"):
        flow.append(Paragraph("Priority Actions", h2))
        for i, a in enumerate(ai["priority_actions"], 1):
            flow.append(Paragraph(
                f"<font color='{TERRA.hexval()}'><b>{i}.</b></font> <b>{_safe(a.get('title',''))}</b>",
                body,
            ))
            flow.append(Paragraph(
                f"<b>Impact:</b> {_safe(a.get('estimated_impact','—'))} &nbsp;·&nbsp; "
                f"<b>Effort:</b> {_safe(a.get('estimated_effort','—'))}",
                muted,
            ))
            flow.append(Paragraph(f"<b>Why:</b> {_safe(a.get('why',''))}", body))
            flow.append(Paragraph(f"<b>How:</b> {_safe(a.get('how',''))}", body))
            flow.append(Spacer(1, 0.12 * inch))

    if ai.get("wins"):
        flow.append(Paragraph("What this site does well", h2))
        for w in ai["wins"]:
            flow.append(Paragraph(f"• {_safe(w)}", body))

    # --- Issues ---
    issues = result.get("issues") or []
    if issues:
        flow.append(PageBreak())
        flow.append(Paragraph("All issues found", h2))
        rows = [[
            Paragraph("<b>Severity</b>", body),
            Paragraph("<b>Category</b>", body),
            Paragraph("<b>Issue</b>", body),
            Paragraph("<b>How to fix</b>", body),
        ]]
        for it in issues:
            sev = it.get("severity", "low")
            sev_color = TERRA if sev == "high" else (WARM if sev == "medium" else SAGE)
            rows.append([
                Paragraph(f"<font color='{sev_color.hexval()}'><b>{sev.upper()}</b></font>", body),
                Paragraph(_safe(it.get("category", "")), muted),
                Paragraph(_safe(it.get("message", "")), body),
                Paragraph(_safe(it.get("fix", "")), body),
            ])
        issue_table = Table(rows, colWidths=[0.8*inch, 1.1*inch, 2.4*inch, 2.5*inch])
        issue_table.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, 0), 1, BORDER),
            ("LINEBELOW", (0, 1), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        flow.append(issue_table)

    if ai.get("next_30_days"):
        flow.append(Paragraph("Next 30 days", h2))
        for step in ai["next_30_days"]:
            flow.append(Paragraph(f"→ {_safe(step)}", body))

    flow.append(Spacer(1, 0.4 * inch))
    flow.append(Paragraph("Generated by Goodly", muted))

    doc.build(flow)
    return buf.getvalue()
