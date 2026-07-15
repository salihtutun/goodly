"""Unit tests for features.py — feature flags."""
import os
import pytest
from features import is_enabled, get_all_flags, get_flag_info, _FLAGS


class TestFeatureFlags:
    def test_known_flag_enabled_by_default(self):
        assert is_enabled("ai_visibility") is True
        assert is_enabled("social_audit") is True
        assert is_enabled("gbp_audit") is True

    def test_new_dashboard_disabled_by_default(self):
        assert is_enabled("new_dashboard") is False
        assert is_enabled("revenue_impact") is False

    def test_unknown_flag_returns_false(self):
        assert is_enabled("nonexistent_flag") is False

    def test_env_var_disables_flag(self, monkeypatch):
        monkeypatch.setenv("FEATURE_AI_VISIBILITY", "false")
        assert is_enabled("ai_visibility") is False

    def test_env_var_enables_flag(self, monkeypatch):
        monkeypatch.setenv("FEATURE_NEW_DASHBOARD", "true")
        assert is_enabled("new_dashboard") is True

    def test_env_var_zero_disables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_SOCIAL_AUDIT", "0")
        assert is_enabled("social_audit") is False

    def test_env_var_no_disables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_GBP_AUDIT", "no")
        assert is_enabled("gbp_audit") is False

    def test_env_var_off_disables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_COMPETITOR_COMPARISON", "off")
        assert is_enabled("competitor_comparison") is False

    def test_env_var_one_enables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_REVENUE_IMPACT", "1")
        assert is_enabled("revenue_impact") is True

    def test_env_var_yes_enables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_REVENUE_IMPACT", "yes")
        assert is_enabled("revenue_impact") is True

    def test_env_var_on_enables(self, monkeypatch):
        monkeypatch.setenv("FEATURE_REVENUE_IMPACT", "on")
        assert is_enabled("revenue_impact") is True

    def test_get_all_flags_returns_dict(self):
        flags = get_all_flags()
        assert isinstance(flags, dict)
        assert "ai_visibility" in flags
        assert "new_dashboard" in flags

    def test_get_flag_info_known(self):
        info = get_flag_info("ai_visibility")
        assert info is not None
        assert info["name"] == "ai_visibility"
        assert "description" in info
        assert "enabled" in info
        assert "default" in info

    def test_get_flag_info_unknown(self):
        assert get_flag_info("nonexistent") is None

    def test_all_flags_have_required_fields(self):
        for name, flag in _FLAGS.items():
            assert "default" in flag, f"{name} missing default"
            assert "description" in flag, f"{name} missing description"
            assert "env" in flag, f"{name} missing env"
