"""Unit tests for pdf_export.py — PDF report generation."""
import pytest
from unittest.mock import patch, MagicMock

from pdf_export import _safe, _score_color, build_audit_pdf


# ---------------------------------------------------------------------------
# _safe
# ---------------------------------------------------------------------------

def test_safe_escapes_html():
    """_safe escapes HTML special characters."""
    result = _safe("<script>alert('xss')</script>")
    assert "<script>" not in result
    assert "&lt;script&gt;" in result


def test_safe_handles_none():
    """_safe returns empty string for None."""
    assert _safe(None) == ""


def test_safe_handles_empty_string():
    """_safe returns empty string for empty input."""
    assert _safe("") == ""


def test_safe_handles_ampersand():
    """_safe escapes ampersands."""
    result = _safe("A & B")
    assert "&amp;" in result


def test_safe_handles_plain_text():
    """_safe returns plain text unchanged."""
    result = _safe("Just normal text.")
    assert result == "Just normal text."


def test_safe_handles_numbers():
    """_safe converts numbers to strings."""
    result = _safe(42)
    assert result == "42"


# ---------------------------------------------------------------------------
# _score_color
# ---------------------------------------------------------------------------

def test_score_color_high():
    """_score_color returns SAGE for scores >= 75."""
    from pdf_export import SAGE
    assert _score_color(75) == SAGE
    assert _score_color(100) == SAGE


def test_score_color_medium():
    """_score_color returns WARM for scores 50-74."""
    from pdf_export import WARM
    assert _score_color(50) == WARM
    assert _score_color(74) == WARM


def test_score_color_low():
    """_score_color returns TERRA for scores < 50."""
    from pdf_export import TERRA
    assert _score_color(49) == TERRA
    assert _score_color(0) == TERRA


# ---------------------------------------------------------------------------
# build_audit_pdf
# ---------------------------------------------------------------------------

def test_build_audit_pdf_returns_bytes():
    """build_audit_pdf returns bytes (PDF content)."""
    audit = {
        "result": {
            "url": "https://example.com",
            "overall_score": 85,
            "load_time_ms": 450,
            "status_code": 200,
            "categories": {
                "meta_tags": 80, "headings": 90, "performance": 85,
                "mobile": 100, "accessibility": 70, "content": 75,
                "social": 60, "security": 100,
            },
            "issues": [
                {"severity": "medium", "category": "Meta Tags",
                 "message": "Title too long", "fix": "Shorten title"},
            ],
        },
        "ai_recommendations": {
            "summary": "Good overall SEO with minor issues.",
            "priority_actions": [
                {
                    "title": "Fix title length",
                    "estimated_impact": "High",
                    "estimated_effort": "Low",
                    "why": "Titles affect CTR",
                    "how": "Shorten to 50-60 chars",
                },
            ],
            "wins": ["Great HTTPS setup", "Good mobile score"],
            "next_30_days": ["Fix title", "Add more content"],
        },
    }
    result = build_audit_pdf(audit)
    assert isinstance(result, bytes)
    assert len(result) > 0
    # PDF files start with %PDF
    assert result.startswith(b"%PDF")


def test_build_audit_pdf_minimal_audit():
    """build_audit_pdf works with minimal audit data."""
    audit = {
        "result": {
            "url": "https://example.com",
            "overall_score": 50,
            "load_time_ms": 1000,
            "status_code": 200,
            "categories": {},
            "issues": [],
        },
        "ai_recommendations": {},
    }
    result = build_audit_pdf(audit)
    assert isinstance(result, bytes)
    assert result.startswith(b"%PDF")


def test_build_audit_pdf_no_ai_recommendations():
    """build_audit_pdf works when ai_recommendations is None."""
    audit = {
        "result": {
            "url": "https://example.com",
            "overall_score": 0,
            "load_time_ms": 5000,
            "status_code": 200,
            "categories": {},
            "issues": [],
        },
        "ai_recommendations": None,
    }
    result = build_audit_pdf(audit)
    assert isinstance(result, bytes)
    assert result.startswith(b"%PDF")


def test_build_audit_pdf_with_many_issues():
    """build_audit_pdf handles a large number of issues."""
    issues = [
        {"severity": s, "category": "Test", "message": f"Issue {i}", "fix": f"Fix {i}"}
        for i, s in enumerate(["high", "medium", "low"] * 5)
    ]
    audit = {
        "result": {
            "url": "https://example.com",
            "overall_score": 30,
            "load_time_ms": 2000,
            "status_code": 200,
            "categories": {"meta_tags": 30},
            "issues": issues,
        },
        "ai_recommendations": {
            "priority_actions": [
                {"title": f"Action {i}", "estimated_impact": "High",
                 "estimated_effort": "Medium", "why": f"Reason {i}", "how": f"Method {i}"}
                for i in range(5)
            ],
        },
    }
    result = build_audit_pdf(audit)
    assert isinstance(result, bytes)
    assert result.startswith(b"%PDF")


def test_build_audit_pdf_handles_none_score():
    """build_audit_pdf handles None overall_score gracefully."""
    audit = {
        "result": {
            "url": "https://example.com",
            "overall_score": None,
            "load_time_ms": None,
            "status_code": None,
            "categories": None,
            "issues": None,
        },
        "ai_recommendations": None,
    }
    result = build_audit_pdf(audit)
    assert isinstance(result, bytes)
    assert result.startswith(b"%PDF")
