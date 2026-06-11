"""
AI Job Agent — Data Cleaner

Utilities for cleaning, normalizing, and deduplicating job records
before they are exported to CSV.
"""

import re
import html


def clean_text(text: str) -> str:
    """
    Clean a text string by removing HTML entities, extra whitespace,
    and non-printable characters.

    Args:
        text: Raw text string.

    Returns:
        Cleaned text string.
    """
    if not text or text == "N/A":
        return text

    # Decode HTML entities: &amp; → &, &lt; → <, etc.
    text = html.unescape(text)

    # Remove HTML tags if any slipped through
    text = re.sub(r"<[^>]+>", "", text)

    # Normalize whitespace: tabs, newlines, multiple spaces → single space
    text = re.sub(r"\s+", " ", text)

    # Strip leading/trailing whitespace
    text = text.strip()

    return text


def clean_salary(salary: str) -> str:
    """
    Normalize salary strings across platforms into a consistent format.

    Args:
        salary: Raw salary string (e.g., "₹10,00,000 - ₹20,00,000 PA").

    Returns:
        Cleaned salary string, or "N/A" if not available.
    """
    if not salary or salary.strip() in ("N/A", "", "-", "Not disclosed", "Not Disclosed"):
        return "N/A"

    salary = clean_text(salary)
    return salary


def clean_url(url: str) -> str:
    """
    Clean and validate a job URL.

    Args:
        url: Raw URL string.

    Returns:
        Cleaned URL or "N/A" if invalid.
    """
    if not url or url == "N/A":
        return "N/A"

    url = url.strip()

    # Ensure URL starts with http(s)
    if not url.startswith(("http://", "https://")):
        if url.startswith("//"):
            url = "https:" + url
        elif url.startswith("/"):
            return "N/A"  # Relative URL without base — can't resolve

    return url


def clean_job(job: dict) -> dict:
    """
    Apply all cleaning functions to a single job record.

    Args:
        job: A normalized job dictionary.

    Returns:
        The same dictionary with all text fields cleaned.
    """
    return {
        "job_title": clean_text(job.get("job_title", "N/A")),
        "company": clean_text(job.get("company", "N/A")),
        "location": clean_text(job.get("location", "N/A")),
        "salary": clean_salary(job.get("salary", "N/A")),
        "experience": clean_text(job.get("experience", "N/A")),
        "skills": clean_text(job.get("skills", "N/A")),
        "job_url": clean_url(job.get("job_url", "N/A")),
        "posted_date": clean_text(job.get("posted_date", "N/A")),
        "source": job.get("source", "N/A"),
        "scraped_at": job.get("scraped_at", "N/A"),
    }


def deduplicate(jobs: list[dict]) -> list[dict]:
    """
    Remove duplicate job listings based on (job_title, company, source).

    Keeps the first occurrence of each unique combination.

    Args:
        jobs: List of job dictionaries.

    Returns:
        Deduplicated list of job dictionaries.
    """
    seen = set()
    unique_jobs = []

    for job in jobs:
        # Create a dedup key from title + company + source (all lowercased)
        key = (
            job.get("job_title", "").lower().strip(),
            job.get("company", "").lower().strip(),
            job.get("source", "").lower().strip(),
        )

        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    return unique_jobs


def clean_and_deduplicate(jobs: list[dict]) -> list[dict]:
    """
    Full cleaning pipeline: clean all records, then deduplicate.

    Args:
        jobs: Raw list of job dictionaries from all scrapers.

    Returns:
        Cleaned and deduplicated list of job dictionaries.
    """
    cleaned = [clean_job(job) for job in jobs]
    deduped = deduplicate(cleaned)
    return deduped
