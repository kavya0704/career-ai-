"""
AI Job Agent — Base Scraper

Abstract base class that all platform-specific scrapers must extend.
Enforces a consistent interface and provides shared utilities for
data normalization, logging, and request handling.
"""

import random
import time
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone

import requests

import config


class BaseScraper(ABC):
    """
    Abstract base class for all job scrapers.

    Every platform scraper (RemoteOK, Naukri, Wellfound) must inherit
    from this class and implement the `scrape()` method.

    Provides:
        - Unified logging per scraper
        - HTTP session with rotating User-Agent headers
        - Random delay utility to avoid rate limiting
        - Data normalization to the unified CSV schema
    """

    def __init__(self, source_name: str):
        """
        Initialize the base scraper.

        Args:
            source_name: Platform identifier (e.g., "RemoteOK", "Naukri", "Wellfound").
                         Used in the `source` field of normalized job records.
        """
        self.source_name = source_name
        self.logger = logging.getLogger(f"job_agent.{source_name}")

        # Create a reusable HTTP session for connection pooling
        self.session = requests.Session()
        self.session.headers.update(config.DEFAULT_HEADERS)

    # ──────────────────────────────────────────────
    # Abstract method — must be implemented by subclasses
    # ──────────────────────────────────────────────

    @abstractmethod
    def scrape(self, job_title: str, location: str = "") -> list[dict]:
        """
        Fetch job listings for the given title from this platform.

        Args:
            job_title: The job title to search for (e.g., "product manager").
            location:  Optional location filter (e.g., "bangalore"). If empty,
                       searches all locations.

        Returns:
            A list of normalized job dictionaries matching the unified schema.
            Each dict must contain all keys defined in config.CSV_COLUMNS.
            Returns an empty list if no jobs are found or an error occurs.
        """
        pass

    # ──────────────────────────────────────────────
    # Shared utilities for all scrapers
    # ──────────────────────────────────────────────

    def normalize(self, raw_data: dict) -> dict:
        """
        Map a raw job record to the unified CSV schema.

        Fills in defaults for missing fields and adds metadata
        (`source` and `scraped_at` timestamp).

        Args:
            raw_data: A dictionary with platform-specific job data.
                      Keys should match the unified schema where possible.

        Returns:
            A normalized dictionary with all keys from config.CSV_COLUMNS.
        """
        now = datetime.now(timezone.utc).isoformat()

        normalized = {
            "job_title": raw_data.get("job_title", "N/A"),
            "company": raw_data.get("company", "N/A"),
            "location": raw_data.get("location", "N/A"),
            "salary": raw_data.get("salary", "N/A"),
            "experience": raw_data.get("experience", "N/A"),
            "skills": raw_data.get("skills", "N/A"),
            "job_url": raw_data.get("job_url", "N/A"),
            "posted_date": raw_data.get("posted_date", "N/A"),
            "source": self.source_name,
            "scraped_at": now,
        }

        return normalized

    def get_random_user_agent(self) -> str:
        """Return a randomly selected User-Agent string from the rotation pool."""
        return random.choice(config.USER_AGENTS)

    def set_random_user_agent(self):
        """Update the session's User-Agent header with a random selection."""
        ua = self.get_random_user_agent()
        self.session.headers["User-Agent"] = ua
        self.logger.debug("Using User-Agent: %s", ua[:50] + "...")

    def random_delay(self):
        """
        Sleep for a random duration between REQUEST_DELAY_MIN and REQUEST_DELAY_MAX.
        Used between paginated requests to avoid rate limiting / anti-bot detection.
        """
        delay = random.uniform(config.REQUEST_DELAY_MIN, config.REQUEST_DELAY_MAX)
        self.logger.debug("Sleeping for %.1f seconds...", delay)
        time.sleep(delay)

    def safe_get(self, url: str, **kwargs) -> requests.Response | None:
        """
        Perform a GET request with error handling and timeout.

        Rotates the User-Agent before each request. Returns None if
        the request fails (timeout, HTTP error, connection error).

        Args:
            url: The URL to request.
            **kwargs: Additional keyword arguments passed to requests.get().

        Returns:
            The Response object on success, or None on failure.
        """
        self.set_random_user_agent()

        try:
            response = self.session.get(
                url,
                timeout=config.REQUEST_TIMEOUT,
                **kwargs,
            )
            response.raise_for_status()
            self.logger.info("GET %s — %d OK", url[:80], response.status_code)
            return response

        except requests.exceptions.HTTPError as e:
            self.logger.warning("HTTP error for %s — %s", url[:80], e)
        except requests.exceptions.ConnectionError as e:
            self.logger.error("Connection error for %s — %s", url[:80], e)
        except requests.exceptions.Timeout:
            self.logger.warning("Request timed out for %s", url[:80])
        except requests.exceptions.RequestException as e:
            self.logger.error("Request failed for %s — %s", url[:80], e)

        return None

    def title_matches(self, job_title: str, search_title: str) -> bool:
        """
        Check if a job title matches the search query (case-insensitive substring match).

        Args:
            job_title: The title from the job listing.
            search_title: The title the user is searching for.

        Returns:
            True if search_title appears as a substring of job_title (case-insensitive).
        """
        return search_title.lower() in job_title.lower()

    def close(self):
        """Close the HTTP session and release resources."""
        self.session.close()
        self.logger.debug("Session closed for %s scraper", self.source_name)
