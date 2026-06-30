"""AI Assistant Visibility — "If someone asks ChatGPT about your category, do you get mentioned?"

We can't actually query OpenAI / Perplexity / Gemini cheaply, so we use Google Gemini
2.5 Pro to simulate each assistant's likely behavior given the prompt. This is
a heuristic — the user understands it's best-effort directional signal, not a
deterministic measurement. We're transparent about that in the UI.
"""
from typing import List, Optional

from llm_client import ask_json, PRO_MODEL


SYSTEM: str = (
    "You are simulating how popular AI assistants would respond to a user query. "
    "Be realistic about training-data limits — assistants only know what was in "
    "their training data plus widely-cited sources. ALWAYS respond with valid JSON only."
)


ASSISTANTS = ["ChatGPT", "Claude", "Perplexity", "Google Gemini"]


async def check_ai_visibility(
    *,
    business_name: str,
    category: str,
    location: str = "",
    website: str = "",
    queries: Optional[List[str]] = None,
) -> dict:
    """Run a single multi-assistant probe and return a visibility report."""
    # Generate sensible user queries if none provided
    if not queries:
        queries = [
            f"best {category}" + (f" in {location}" if location else ""),
            f"top {category}" + (f" near me ({location})" if location else " companies"),
            f"who do you recommend for {category}" + (f" in {location}" if location else ""),
        ]
    queries = [q.strip() for q in queries if q.strip()][:5]

    prompt = f"""\
Estimate how today's AI assistants ({', '.join(ASSISTANTS)}) would respond to typical
user queries about this category — and whether they would mention this specific business.

BUSINESS:
- Name: {business_name}
- Category / niche: {category}
- Location: {location or '(global / not specified)'}
- Website: {website or '(none provided)'}

USER QUERIES TO SIMULATE:
{chr(10).join("- " + q for q in queries)}

For EACH of the {len(ASSISTANTS)} assistants and EACH query, simulate their likely
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
- discoverability_signals_missing: 3-6 specific online artifacts an AI would need to see (e.g., "A 'best of' list on a high-DA blog", "Reddit recommendations in r/Portland", "Press in The Oregonian").
"""
    return await ask_json(prompt, system_message=SYSTEM, model=PRO_MODEL)
