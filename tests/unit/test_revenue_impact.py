"""Unit tests for revenue_impact.py — CTR, conversion rates, customer value, issue classification, revenue estimation."""
import pytest
from revenue_impact import (
    get_ctr_for_position,
    get_conversion_rate,
    get_customer_value,
    classify_issue_type,
    estimate_issue_revenue_impact,
    estimate_total_revenue_impact,
    CTR_BY_POSITION,
    CONVERSION_RATES,
    AVERAGE_CUSTOMER_VALUE,
    ISSUE_TRAFFIC_IMPACT,
)


class TestGetCtrForPosition:
    def test_known_positions(self):
        assert get_ctr_for_position(1) == 0.285
        assert get_ctr_for_position(3) == 0.110
        assert get_ctr_for_position(10) == 0.025

    def test_unknown_position_defaults(self):
        assert get_ctr_for_position(50) == 0.01
        assert get_ctr_for_position(0) == 0.01


class TestGetConversionRate:
    def test_default(self):
        assert get_conversion_rate() == 0.025

    def test_known_industry(self):
        assert get_conversion_rate("legal") == 0.045
        assert get_conversion_rate("home_services") == 0.035

    def test_industry_with_spaces(self):
        assert get_conversion_rate("Home Services") == 0.035

    def test_industry_with_hyphens(self):
        assert get_conversion_rate("real-estate") == 0.028

    def test_unknown_industry_defaults(self):
        assert get_conversion_rate("nonexistent") == 0.025


class TestGetCustomerValue:
    def test_default(self):
        assert get_customer_value() == 500

    def test_known_industry(self):
        assert get_customer_value("legal") == 3500
        assert get_customer_value("b2b") == 5000

    def test_unknown_industry_defaults(self):
        assert get_customer_value("nonexistent") == 500


class TestClassifyIssueType:
    def test_missing_title(self):
        assert classify_issue_type({"title": "Missing title tag"}) == "missing_title"
        assert classify_issue_type({"message": "title is empty"}) == "missing_title"

    def test_title_too_long(self):
        assert classify_issue_type({"title": "Title too long"}) == "title_too_long"

    def test_title_too_short(self):
        assert classify_issue_type({"title": "Title too short"}) == "title_too_short"

    def test_missing_meta_description(self):
        assert classify_issue_type({"title": "Meta description is missing"}) == "missing_meta_description"

    def test_meta_description_too_long(self):
        assert classify_issue_type({"title": "Meta description too long"}) == "meta_description_too_long"

    def test_missing_og_tags(self):
        assert classify_issue_type({"title": "Missing og: tags"}) == "missing_og_tags"
        assert classify_issue_type({"title": "Open Graph tags missing"}) == "missing_og_tags"

    def test_missing_h1(self):
        assert classify_issue_type({"title": "H1 tag is missing"}) == "missing_h1"

    def test_multiple_h1(self):
        assert classify_issue_type({"title": "Multiple H1 tags found"}) == "multiple_h1"

    def test_missing_h2(self):
        assert classify_issue_type({"title": "H2 heading missing"}) == "missing_h2"

    def test_heading_structure(self):
        assert classify_issue_type({"title": "Heading structure is wrong"}) == "heading_structure"

    def test_thin_content(self):
        assert classify_issue_type({"title": "Content is thin"}) == "thin_content"

    def test_duplicate_content(self):
        assert classify_issue_type({"title": "Duplicate content detected"}) == "duplicate_content"

    def test_low_word_count(self):
        assert classify_issue_type({"title": "Word count too low"}) == "low_word_count"
        assert classify_issue_type({"title": "Content length is short"}) == "low_word_count"

    def test_missing_keywords(self):
        assert classify_issue_type({"title": "Keywords missing"}) == "missing_keywords"

    def test_slow_page_speed(self):
        assert classify_issue_type({"title": "Page speed is slow"}) == "slow_page_speed"
        assert classify_issue_type({"title": "Performance issue"}) == "slow_page_speed"

    def test_not_mobile_friendly(self):
        assert classify_issue_type({"title": "Not mobile friendly"}) == "not_mobile_friendly"

    def test_missing_ssl(self):
        assert classify_issue_type({"title": "SSL certificate missing"}) == "missing_ssl"

    def test_broken_links(self):
        assert classify_issue_type({"title": "Broken links found"}) == "broken_links"

    def test_missing_canonical(self):
        assert classify_issue_type({"title": "Canonical URL missing"}) == "missing_canonical"

    def test_missing_robots(self):
        assert classify_issue_type({"title": "Robots.txt missing"}) == "missing_robots"

    def test_missing_sitemap(self):
        assert classify_issue_type({"title": "Sitemap not found"}) == "missing_sitemap"

    def test_missing_alt_text(self):
        assert classify_issue_type({"title": "Alt text missing"}) == "missing_alt_text"

    def test_large_images(self):
        assert classify_issue_type({"title": "Images too large"}) == "large_images"

    def test_missing_image_dimensions(self):
        assert classify_issue_type({"title": "Image dimensions missing"}) == "missing_image_dimensions"

    def test_low_internal_links(self):
        assert classify_issue_type({"title": "Low internal links"}) == "low_internal_links"

    def test_broken_external_links(self):
        # "broken" + "link" matches before "external link" + "broken"
        assert classify_issue_type({"title": "Broken external links"}) == "broken_links"

    def test_low_external_links(self):
        assert classify_issue_type({"title": "Low external links"}) == "low_external_links"

    def test_default_fallback(self):
        assert classify_issue_type({"title": "Some random issue"}) == "default"
        assert classify_issue_type({}) == "default"


class TestEstimateIssueRevenueImpact:
    def test_high_severity_issue(self):
        result = estimate_issue_revenue_impact(
            {"title": "Missing title tag", "severity": "high"},
            monthly_traffic=2000, industry="legal", current_position=10,
        )
        assert result["issue_type"] == "missing_title"
        assert result["severity"] == "high"
        assert result["estimated_monthly_revenue_loss"] > 0
        assert result["estimated_annual_revenue_loss"] > 0
        assert "explanation" in result
        assert "disclaimer" in result

    def test_low_severity_issue(self):
        result = estimate_issue_revenue_impact(
            {"title": "Missing alt text", "severity": "low"},
            monthly_traffic=1000, current_position=5,
        )
        assert result["severity"] == "low"
        assert result["estimated_monthly_revenue_loss"] >= 0

    def test_default_severity(self):
        result = estimate_issue_revenue_impact(
            {"title": "Missing H1", "severity": "unknown"},
            monthly_traffic=1000,
        )
        assert result["severity"] == "unknown"

    def test_uses_message_when_no_title(self):
        result = estimate_issue_revenue_impact(
            {"message": "Page speed is slow", "severity": "medium"},
            monthly_traffic=1000,
        )
        assert result["issue_title"] == "Page speed is slow"

    def test_unknown_issue_title(self):
        result = estimate_issue_revenue_impact(
            {}, monthly_traffic=1000,
        )
        assert result["issue_title"] == "Unknown issue"

    def test_position_1_no_improvement(self):
        result = estimate_issue_revenue_impact(
            {"title": "Missing title tag", "severity": "high"},
            monthly_traffic=1000, current_position=1,
        )
        # At position 1, CTR gain is 0, so no additional clicks
        assert result["estimated_additional_clicks"] == 0


class TestEstimateTotalRevenueImpact:
    def test_multiple_issues(self):
        issues = [
            {"title": "Missing title tag", "severity": "high"},
            {"title": "Page speed is slow", "severity": "medium"},
            {"title": "Missing alt text", "severity": "low"},
        ]
        result = estimate_total_revenue_impact(issues, monthly_traffic=2000, industry="home_services")
        assert result["total_issues"] == 3
        assert result["total_estimated_monthly_revenue_loss"] > 0
        assert len(result["per_issue"]) == 3
        assert len(result["top_quick_wins"]) == 3
        assert "summary" in result
        assert "disclaimer" in result

    def test_empty_issues(self):
        result = estimate_total_revenue_impact([], monthly_traffic=1000)
        assert result["total_issues"] == 0
        assert result["total_estimated_monthly_revenue_loss"] == 0
        assert result["top_quick_wins"] == []

    def test_sorts_by_highest_impact(self):
        issues = [
            {"title": "Missing alt text", "severity": "low"},
            {"title": "Missing title tag", "severity": "high"},
        ]
        result = estimate_total_revenue_impact(issues, monthly_traffic=2000)
        # High severity title tag should be first
        assert result["per_issue"][0]["issue_type"] == "missing_title"
