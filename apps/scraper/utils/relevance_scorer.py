import re

def normalize_skills(skills_text: str) -> list[str]:
    if not skills_text:
        return []
    # Lowercase, replace special symbols
    text = skills_text.lower()
    text = text.replace("c++", "cpp").replace("c#", "csharp").replace(".net", "dotnet")
    # Split by spaces, commas, slashes, pipes, dots
    tokens = re.split(r'[\s,\./\|]+', text)
    # Return unique tokens, keeping short important ones like go, js, ts, python, etc.
    return list(set([t for t in tokens if len(t) > 1 or t in {'go', 'c', 'r'}]))

def title_boost(job: dict, search_role: str) -> int:
    if not search_role:
        return 0
    title = job.get("title", "").lower()
    role_words = [w for w in re.split(r'\s+', search_role.lower()) if len(w) > 2]
    if not role_words:
        return 0
    # If all words of search_role exist in title, +20
    if all(w in title for w in role_words):
        return 20
    # If any word exists, +10
    if any(w in title for w in role_words):
        return 10
    return 0

def recency_boost(job: dict) -> int:
    posted = job.get("posted_date", "").lower()
    if not posted:
        return 0
    if any(x in posted for x in ["hour", "day", "minute", "today", "yesterday", "just now"]):
        match = re.search(r'(\d+)\s+day', posted)
        if match:
            days = int(match.group(1))
            if days < 7:
                return 10
            return 0
        return 10
    return 0

def score_relevance(job: dict, user_skills: list[str], search_role: str = "") -> dict:
    """
    Score how well a job matches user skills and search query.
    Uses Jaccard similarity on normalized skill tokens.
    Returns job dict with relevance_score: 0-100 added.
    """
    job_skills_raw = job.get("skills", "")
    if isinstance(job_skills_raw, list):
        job_skills_raw = " ".join(job_skills_raw)
        
    job_skills = set(normalize_skills(job_skills_raw))
    user_skills_set = set(normalize_skills(" ".join(user_skills)))

    if not job_skills or not user_skills_set:
        # Neutral default if no skills listed
        base_score = 50
    else:
        # Jaccard similarity
        intersection = len(job_skills & user_skills_set)
        union = len(job_skills | user_skills_set)
        jaccard = intersection / union if union > 0 else 0
        base_score = int(jaccard * 70)

    # Apply boosts
    score = base_score + title_boost(job, search_role) + recency_boost(job)
    job["relevance_score"] = min(score, 100)
    return job
