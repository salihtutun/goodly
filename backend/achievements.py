"""Achievement/badge system for gamifying user progress."""

ACHIEVEMENTS = {
    "first_audit": {
        "id": "first_audit",
        "name": "First Audit",
        "description": "Ran your first SEO audit",
        "icon": "🔍",
        "category": "onboarding",
    },
    "score_improver": {
        "id": "score_improver",
        "name": "Score Improver",
        "description": "Improved your SEO score by 10+ points",
        "icon": "📈",
        "category": "progress",
    },
    "score_master": {
        "id": "score_master",
        "name": "Score Master",
        "description": "Improved your SEO score by 25+ points",
        "icon": "🏆",
        "category": "progress",
    },
    "keyword_climber": {
        "id": "keyword_climber",
        "name": "Keyword Climber",
        "description": "A tracked keyword moved up 5+ positions",
        "icon": "🚀",
        "category": "serp",
    },
    "keyword_winner": {
        "id": "keyword_winner",
        "name": "Keyword Winner",
        "description": "A tracked keyword reached the top 3",
        "icon": "🥇",
        "category": "serp",
    },
    "streak_3": {
        "id": "streak_3",
        "name": "3-Week Streak",
        "description": "3 consecutive weeks of score improvement",
        "icon": "🔥",
        "category": "streak",
    },
    "streak_8": {
        "id": "streak_8",
        "name": "8-Week Streak",
        "description": "8 consecutive weeks of score improvement",
        "icon": "💪",
        "category": "streak",
    },
    "audit_10": {
        "id": "audit_10",
        "name": "Dedicated",
        "description": "Ran 10 audits",
        "icon": "📊",
        "category": "volume",
    },
    "audit_50": {
        "id": "audit_50",
        "name": "Power User",
        "description": "Ran 50 audits",
        "icon": "⚡",
        "category": "volume",
    },
    "all_categories": {
        "id": "all_categories",
        "name": "Full Stack",
        "description": "Used all audit types (SEO, Social, AI, GBP)",
        "icon": "🌟",
        "category": "variety",
    },
    "perfect_score": {
        "id": "perfect_score",
        "name": "Perfect Score",
        "description": "Achieved a score of 90+ on any audit",
        "icon": "💎",
        "category": "excellence",
    },
    "referral_3": {
        "id": "referral_3",
        "name": "Connector",
        "description": "Referred 3 friends who signed up",
        "icon": "🤝",
        "category": "social",
    },
}


async def check_achievements(db, user_id: str) -> list:
    """Check which new achievements a user has earned. Returns list of newly earned achievement dicts."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return []

    earned = set(user.get("achievements") or [])
    newly_earned = []

    # Count audits
    audit_count = await db.audits.count_documents({"user_id": user_id})

    # First audit
    if audit_count >= 1 and "first_audit" not in earned:
        newly_earned.append(ACHIEVEMENTS["first_audit"])

    # Audit volume
    if audit_count >= 10 and "audit_10" not in earned:
        newly_earned.append(ACHIEVEMENTS["audit_10"])
    if audit_count >= 50 and "audit_50" not in earned:
        newly_earned.append(ACHIEVEMENTS["audit_50"])

    # Check score improvement
    audits = await db.audits.find(
        {"user_id": user_id},
        {"result.overall_score": 1, "overall_score": 1, "created_at": 1},
        sort=[("created_at", -1)],
    ).to_list(100)

    if len(audits) >= 2:
        scores = []
        for a in audits:
            s = (a.get("result") or {}).get("overall_score") or a.get("overall_score", 0)
            scores.append(s)

        best_improvement = 0
        for i in range(len(scores) - 1):
            improvement = scores[i] - scores[i + 1]
            if improvement > best_improvement:
                best_improvement = improvement

        if best_improvement >= 10 and "score_improver" not in earned:
            newly_earned.append(ACHIEVEMENTS["score_improver"])
        if best_improvement >= 25 and "score_master" not in earned:
            newly_earned.append(ACHIEVEMENTS["score_master"])

        # Check for 90+ score
        if max(scores) >= 90 and "perfect_score" not in earned:
            newly_earned.append(ACHIEVEMENTS["perfect_score"])

    # Check SERP keyword improvements
    serp_checks = await db.serp_checks.find(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    ).to_list(50)

    if len(serp_checks) >= 2:
        for check in serp_checks:
            rank = check.get("rank", 100)
            if rank <= 3 and "keyword_winner" not in earned:
                newly_earned.append(ACHIEVEMENTS["keyword_winner"])
                break

    # Check referral count
    referral_count = await db.referrals.count_documents({"referrer_id": user_id})
    if referral_count >= 3 and "referral_3" not in earned:
        newly_earned.append(ACHIEVEMENTS["referral_3"])

    # Save newly earned achievements
    if newly_earned:
        new_ids = [a["id"] for a in newly_earned]
        await db.users.update_one(
            {"id": user_id},
            {"$addToSet": {"achievements": {"$each": new_ids}}},
        )

    return newly_earned


def get_all_achievements() -> list:
    """Return all possible achievements."""
    return list(ACHIEVEMENTS.values())
