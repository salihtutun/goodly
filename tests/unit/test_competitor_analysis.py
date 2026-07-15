"""Unit tests for competitor_analysis.py — compare_competitors and helper functions."""
import pytest
from unittest.mock import AsyncMock, patch


SAMPLE_TARGET = {
    "url": "https://mysite.com",
    "overall_score": 65,
    "fetch_failed": False,
    "categories": {
        "meta_tags": 70, "headings": 60, "performance": 55,
        "mobile": 80, "content": 50, "security": 90,
    },
    "issues": [{"severity": "high", "message": "Missing H1"}],
    "load_time_ms": 2500,
    "content": {"word_count": 300},
}

SAMPLE_COMPETITOR = {
    "url": "https://competitor.com",
    "overall_score": 85,
    "fetch_failed": False,
    "categories": {
        "meta_tags": 90, "headings": 85, "performance": 80,
        "mobile": 90, "content": 75, "security": 95,
    },
    "issues": [],
    "load_time_ms": 1200,
    "content": {"word_count": 800},
}


class TestCompareCompetitors:
    """Tests for compare_competitors()."""

    @pytest.mark.asyncio
    async def test_target_fetch_failed(self):
        from competitor_analysis import compare_competitors
        with patch("competitor_analysis.analyze_url") as mock_analyze:
            mock_analyze.return_value = {"fetch_failed": True, "url": "https://mysite.com"}
            result = await compare_competitors("https://mysite.com", ["https://comp.com"])
            assert "error" in result
            assert "Could not analyze target site" in result["error"]

    @pytest.mark.asyncio
    async def test_target_exception(self):
        from competitor_analysis import compare_competitors
        with patch("competitor_analysis.analyze_url") as mock_analyze:
            mock_analyze.side_effect = [Exception("timeout"), SAMPLE_COMPETITOR]
            result = await compare_competitors("https://mysite.com", ["https://comp.com"])
            assert "error" in result

    @pytest.mark.asyncio
    async def test_successful_comparison(self):
        from competitor_analysis import compare_competitors
        with patch("competitor_analysis.analyze_url") as mock_analyze:
            mock_analyze.side_effect = [SAMPLE_TARGET, SAMPLE_COMPETITOR]
            result = await compare_competitors("https://mysite.com", ["https://comp.com"])
            assert result["target"]["overall_score"] == 65
            assert len(result["competitors"]) == 1
            assert result["competitors"][0]["overall_score"] == 85
            assert result["top_competitor"]["overall_score"] == 85
            assert "comparison" in result
            assert "insights" in result
            assert "recommendations" in result

    @pytest.mark.asyncio
    async def test_no_competitors(self):
        from competitor_analysis import compare_competitors
        with patch("competitor_analysis.analyze_url") as mock_analyze:
            mock_analyze.return_value = SAMPLE_TARGET
            result = await compare_competitors("https://mysite.com", [])
            assert result["comparison"] == {"message": "No competitors to compare"}
            assert result["top_competitor"] is None
            assert result["insights"] == []
            assert result["recommendations"] == []

    @pytest.mark.asyncio
    async def test_competitor_exception_handled(self):
        from competitor_analysis import compare_competitors
        with patch("competitor_analysis.analyze_url") as mock_analyze:
            mock_analyze.side_effect = [SAMPLE_TARGET, Exception("timeout")]
            result = await compare_competitors("https://mysite.com", ["https://comp.com"])
            assert len(result["competitors"]) == 0
            assert result["top_competitor"] is None


class TestBuildComparison:
    """Tests for _build_comparison()."""

    def test_no_competitors(self):
        from competitor_analysis import _build_comparison
        result = _build_comparison(SAMPLE_TARGET, [])
        assert result == {"message": "No competitors to compare"}

    def test_with_competitors(self):
        from competitor_analysis import _build_comparison
        result = _build_comparison(SAMPLE_TARGET, [SAMPLE_COMPETITOR])
        assert result["target_score"] == 65
        assert result["competitor_avg_score"] == 85
        assert result["competitor_best_score"] == 85
        assert result["score_gap_to_best"] == 20
        assert result["target_load_ms"] == 2500
        assert result["competitor_avg_load_ms"] == 1200
        assert result["target_word_count"] == 300
        assert result["competitor_avg_word_count"] == 800

    def test_multiple_competitors(self):
        from competitor_analysis import _build_comparison
        comp2 = {**SAMPLE_COMPETITOR, "overall_score": 75, "load_time_ms": 1800, "content": {"word_count": 500}}
        result = _build_comparison(SAMPLE_TARGET, [SAMPLE_COMPETITOR, comp2])
        assert result["competitor_avg_score"] == 80
        assert result["competitor_best_score"] == 85
        assert result["competitor_worst_score"] == 75


class TestGenerateInsights:
    """Tests for _generate_insights()."""

    def test_competitor_outranking(self):
        from competitor_analysis import _generate_insights
        insights = _generate_insights(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        assert len(insights) > 0
        assert any("points higher" in i for i in insights)

    def test_category_gaps(self):
        from competitor_analysis import _generate_insights
        insights = _generate_insights(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        # meta_tags gap: 90 vs 70 = 20 > 10
        assert any("Meta Tags" in i for i in insights)
        # headings gap: 85 vs 60 = 25 > 10
        assert any("Headings" in i for i in insights)
        # content gap: 75 vs 50 = 25 > 10
        assert any("Content Quality" in i for i in insights)

    def test_load_time_insight(self):
        from competitor_analysis import _generate_insights
        insights = _generate_insights(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        assert any("Page Speed" in i for i in insights)

    def test_word_count_insight(self):
        from competitor_analysis import _generate_insights
        insights = _generate_insights(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        assert any("Content:" in i for i in insights)

    def test_no_insights_when_better(self):
        from competitor_analysis import _generate_insights
        better_target = {**SAMPLE_TARGET, "overall_score": 95, "categories": {k: 95 for k in SAMPLE_TARGET["categories"]}, "load_time_ms": 500, "content": {"word_count": 2000}}
        insights = _generate_insights(better_target, SAMPLE_COMPETITOR)
        # Should have no insights since target is better in every way
        assert len(insights) == 0


class TestGenerateRecommendations:
    """Tests for _generate_recommendations()."""

    def test_generates_recommendations(self):
        from competitor_analysis import _generate_recommendations
        recs = _generate_recommendations(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        assert len(recs) > 0
        for rec in recs:
            assert "category" in rec
            assert "gap" in rec
            assert "action" in rec
            assert "effort" in rec
            assert "impact" in rec

    def test_no_recommendations_when_no_gaps(self):
        from competitor_analysis import _generate_recommendations
        recs = _generate_recommendations(SAMPLE_COMPETITOR, SAMPLE_COMPETITOR)
        assert len(recs) == 0

    def test_max_five_recommendations(self):
        from competitor_analysis import _generate_recommendations
        recs = _generate_recommendations(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        assert len(recs) <= 5

    def test_sorted_by_gap_descending(self):
        from competitor_analysis import _generate_recommendations
        recs = _generate_recommendations(SAMPLE_TARGET, SAMPLE_COMPETITOR)
        gaps = [r["gap"] for r in recs]
        assert gaps == sorted(gaps, reverse=True)
