"""v1 AI Visibility prompts — extracted from ai_visibility.py."""
from .. import registry, Prompt

SYSTEM = (
    "You are simulating how popular AI assistants would respond to a user query. "
    "Be realistic about training-data limits — assistants only know what was in "
    "their training data plus widely-cited sources. ALWAYS respond with valid JSON only."
)

ASSISTANTS = ["ChatGPT", "Claude", "Perplexity", "Google Gemini"]

registry.register("ai_visibility_check", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Estimate how today's AI assistants ({assistants}) would respond to typical
user queries about this category — and whether they would mention this specific business.

BUSINESS:
- Name: {business_name}
- Category / niche: {category}
- Location: {location}
- Website: {website}

USER QUERIES TO SIMULATE:
{queries}

For EACH of the {num_assistants} assistants and EACH query, simulate their likely
response. Then return JSON in this EXACT shape:

{{
  "overall_visibility_score": <int 0-100, weighted: mentions_count + position quality>,
  "diagnosis": "2-3 sentence honest assessment in plain English.",
  "per_assistant": [
    {{
      "assistant": "ChatGPT",
      "likely_mentions": <true|false>,
      "estimated_position": <int 1-10 if mentioned, else null>,
      "likely_top_5_brands": ["...", "...", "...", "...", "..."],
      "reasoning": "1-2 sentence why or why not"
    }}
  ],
  "queries_used": [...the queries above...],
  "blocking_factors": [
    {{"factor": "...", "explanation": "...", "fix": "..."}}
  ],
  "discoverability_signals_missing": ["...", "...", "..."],
  "improvement_plan": [
    {{"action": "...", "why": "...", "estimated_effort": "low|medium|high"}}
  ]
}}

GUIDELINES:
- Be honest. If this business is small/new/local, most AIs will NOT mention it by name unless it has strong online citations (Wikipedia, large publications, Reddit threads, etc.).
- "likely_mentions" should be false for most small startups; that's a feature, not a bug — the improvement_plan is the value.
- improvement_plan must be CONCRETE (e.g., "Get featured on TimeOut Portland", not "build authority"). 5-8 actions, ordered by impact.
- blocking_factors: 2-5 honest things keeping this business out of AI answers.
- discoverability_signals_missing: 3-6 specific online artifacts an AI would need to see (e.g., "A 'best of' list on a high-DA blog", "Reddit recommendations in r/Portland", "Press in The Oregonian").""",
    model="gemini-2.5-pro",
    temperature=0.3,
    max_output_tokens=4096,
    metadata={"assistants": ASSISTANTS},
))
