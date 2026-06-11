"""
AI Job Agent — RemoteOK Scraper

Fetches remote job listings from RemoteOK's public REST API.
Endpoint: GET https://remoteok.com/api
No authentication required — just a User-Agent header.
"""

import config
from scrapers.base_scraper import BaseScraper


class RemoteOKScraper(BaseScraper):
    """
    Scraper for RemoteOK using their free public JSON API.

    The API returns a JSON array where the first element is metadata
    and the remaining elements are job listings.
    """

    def __init__(self):
        super().__init__(source_name="RemoteOK")
        # Override headers for the JSON API
        self.session.headers["Accept"] = "application/json"
        # Avoid Brotli encoding — requests can't decode it without the brotli package
        self.session.headers["Accept-Encoding"] = "gzip, deflate"

    def scrape(self, job_title: str, location: str = "") -> list[dict]:
        """
        Fetch and filter RemoteOK jobs matching the given title.

        Args:
            job_title: The job title to search for (e.g., "Python Developer").
            location:  Optional location filter. Note: RemoteOK is remote-first,
                       so most jobs are listed as "Remote". Location is used for
                       filtering only if the API provides location data.

        Returns:
            List of normalized job dictionaries matching the search title.
        """
        self.logger.info("Starting RemoteOK scrape for: '%s'%s",
                         job_title,
                         f" in '{location}'" if location else "")

        # Fetch all jobs from the API
        raw_jobs = self._fetch_jobs()
        if not raw_jobs:
            self.logger.warning("No jobs fetched from RemoteOK API")
            return []

        # Filter jobs that match the search title (by position or tags)
        matched_jobs = []
        for job in raw_jobs:
            position = job.get("position", "")
            tags = job.get("tags", [])
            tags_str = " ".join(tags) if isinstance(tags, list) else str(tags)

            # Match if search term appears in the position title OR in the tags
            if position and (
                self.title_matches(position, job_title)
                or self.title_matches(tags_str, job_title)
            ):
                normalized = self._map_to_schema(job)
                matched_jobs.append(self.normalize(normalized))

        self.logger.info(
            "RemoteOK: Found %d jobs matching '%s' (out of %d total)",
            len(matched_jobs), job_title, len(raw_jobs),
        )
        return matched_jobs

    def _fetch_jobs(self) -> list[dict]:
        """
        Call the RemoteOK API and return the list of job objects.

        Returns:
            List of raw job dictionaries, or empty list on failure.
        """
        response = self.safe_get(config.REMOTEOK_API_URL)
        if response is None:
            return []

        try:
            data = response.json()
        except ValueError as e:
            self.logger.error("Failed to parse RemoteOK JSON response: %s", e)
            return []

        # First element is API metadata/legal notice — skip it
        if isinstance(data, list) and len(data) > 1:
            jobs = data[1:]
            self.logger.info("RemoteOK API returned %d job listings", len(jobs))
            return jobs

        self.logger.warning("Unexpected RemoteOK API response format")
        return []

    def _map_to_schema(self, job: dict) -> dict:
        """
        Map RemoteOK API fields to the unified job schema.

        RemoteOK field mapping:
            position       → job_title
            company        → company
            location       → location
            salary_min/max → salary
            tags           → skills
            url            → job_url
            date           → posted_date

        Args:
            job: Raw job dict from the RemoteOK API.

        Returns:
            Dict with keys matching the unified schema.
        """
        # Build salary string from min/max if available
        salary = self._format_salary(
            job.get("salary_min"),
            job.get("salary_max"),
        )

        # Join tags into a comma-separated skills string
        tags = job.get("tags", [])
        skills = ", ".join(tags) if isinstance(tags, list) else str(tags)

        # Build the full job URL
        slug = job.get("slug", "")
        job_url = f"https://remoteok.com/remote-jobs/{slug}" if slug else job.get("url", "N/A")

        return {
            "job_title": job.get("position", "N/A"),
            "company": job.get("company", "N/A"),
            "location": job.get("location", "Remote"),
            "salary": salary,
            "experience": "N/A",  # RemoteOK doesn't provide experience level
            "skills": skills if skills else "N/A",
            "job_url": job_url,
            "posted_date": job.get("date", "N/A"),
        }

    @staticmethod
    def _format_salary(salary_min, salary_max) -> str:
        """
        Format salary range into a readable string.

        Args:
            salary_min: Minimum salary (int/str or None).
            salary_max: Maximum salary (int/str or None).

        Returns:
            Formatted salary string like "$80,000 - $120,000", or "N/A".
        """
        if salary_min and salary_max:
            try:
                return f"${int(salary_min):,} - ${int(salary_max):,}"
            except (ValueError, TypeError):
                return f"{salary_min} - {salary_max}"
        elif salary_min:
            try:
                return f"${int(salary_min):,}+"
            except (ValueError, TypeError):
                return str(salary_min)
        elif salary_max:
            try:
                return f"Up to ${int(salary_max):,}"
            except (ValueError, TypeError):
                return str(salary_max)
        return "N/A"
