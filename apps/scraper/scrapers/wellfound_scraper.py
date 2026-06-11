"""
AI Job Agent — Wellfound Scraper

Scrapes job listings from Wellfound (formerly AngelList Talent)
using the Firecrawl API for rendering and anti-bot bypass.
Firecrawl returns clean markdown/HTML which we parse for job data.
"""

import re

from firecrawl import Firecrawl

import config
from scrapers.base_scraper import BaseScraper


class WellfoundScraper(BaseScraper):
    """
    Scraper for Wellfound using the Firecrawl managed scraping API.

    Firecrawl handles browser rendering, Cloudflare/DataDome bypass,
    and returns structured markdown content that we parse to extract
    job listings.
    """

    def __init__(self):
        super().__init__(source_name="Wellfound")

        # Validate API key
        if not config.FIRECRAWL_API_KEY:
            self.logger.error("FIRECRAWL_API_KEY is not set in .env file")
            self.firecrawl = None
        else:
            self.firecrawl = Firecrawl(api_key=config.FIRECRAWL_API_KEY)
            self.logger.info("Firecrawl client initialized")

    def scrape(self, job_title: str, location: str = "") -> list[dict]:
        """
        Scrape Wellfound for jobs matching the title and optional location.

        Args:
            job_title: The job title to search for (e.g., "product manager").
            location:  Optional location filter (e.g., "bangalore").

        Returns:
            List of normalized job dictionaries.
        """
        if self.firecrawl is None:
            self.logger.error("Cannot scrape — Firecrawl client not initialized (missing API key)")
            return []

        self.logger.info(
            "Starting Wellfound scrape for: '%s'%s",
            job_title,
            f" in '{location}'" if location else "",
        )

        # Build the Wellfound role URL
        url = self._build_url(job_title, location)
        self.logger.info("Target URL: %s", url)

        # Use Firecrawl to scrape the page
        scraped_data = self._firecrawl_scrape(url)
        if not scraped_data:
            return []

        # Parse the markdown content to extract job listings
        jobs = self._parse_jobs(scraped_data, url)

        # Normalize all jobs
        normalized_jobs = [self.normalize(job) for job in jobs]
        self.logger.info(
            "Wellfound: Found %d jobs for '%s'%s",
            len(normalized_jobs), job_title,
            f" in '{location}'" if location else "",
        )
        return normalized_jobs

    def _build_url(self, job_title: str, location: str) -> str:
        """
        Build the Wellfound role search URL.

        Examples:
            ("product manager", "")        → https://wellfound.com/role/l/product-manager
            ("python developer", "bangalore") → https://wellfound.com/role/l/python-developer/bangalore
        """
        slug = re.sub(r"\s+", "-", job_title.strip().lower())
        base_url = config.WELLFOUND_BASE_URL.format(slug)

        if location:
            loc_slug = re.sub(r"\s+", "-", location.strip().lower())
            return f"{base_url}/{loc_slug}"

        return base_url

    def _firecrawl_scrape(self, url: str) -> dict | None:
        """
        Call the Firecrawl API to scrape the given URL.

        Args:
            url: The Wellfound URL to scrape.

        Returns:
            Dict with scraped data (contains 'markdown' and/or 'html' keys),
            or None on failure.
        """
        try:
            result = self.firecrawl.scrape(url, formats=["markdown"])
            self.logger.info("Firecrawl scrape successful for %s", url[:80])
            return result
        except Exception as e:
            self.logger.error("Firecrawl scrape failed for %s: %s", url[:80], e)
            return None

    def _parse_jobs(self, scraped_data: dict, source_url: str) -> list[dict]:
        """
        Parse the Firecrawl response to extract job listings.

        Firecrawl returns markdown content from the Wellfound page.
        We parse this markdown to identify individual job listings
        by looking for structured patterns (company names, titles,
        salary info, etc.).

        Args:
            scraped_data: Dict returned by Firecrawl (with 'markdown' key).
            source_url: The original URL (used as fallback for job_url).

        Returns:
            List of raw job dicts.
        """
        # Firecrawl returns a Document (pydantic model), not a dict.
        # Access the markdown content via attribute.
        markdown = ""
        if hasattr(scraped_data, "markdown"):
            markdown = scraped_data.markdown or ""
        elif isinstance(scraped_data, dict):
            markdown = scraped_data.get("markdown", "")

        if not markdown:
            self.logger.warning("No markdown content in Firecrawl response")
            return []

        self.logger.debug("Parsing %d characters of markdown content", len(markdown))

        jobs = []

        # Wellfound markdown typically lists jobs in sections with company name,
        # job title, salary range, location, etc. We split by patterns that
        # indicate a new job listing.

        # Strategy 1: Look for job blocks separated by horizontal rules or headers
        # Each block usually contains: Company, Title, Salary, Location
        sections = re.split(r"\n---\n|\n\*\*\*\n|\n#{1,3}\s", markdown)

        for section in sections:
            job = self._extract_job_from_section(section.strip(), source_url)
            if job and job.get("job_title", "N/A") != "N/A":
                jobs.append(job)

        # Strategy 2: If no jobs found via sections, try line-by-line parsing
        if not jobs:
            jobs = self._parse_jobs_line_by_line(markdown, source_url)

        return jobs

    def _extract_job_from_section(self, section: str, source_url: str) -> dict | None:
        """
        Extract job data from a markdown section.

        Args:
            section: A chunk of markdown text potentially containing one job listing.
            source_url: Fallback URL for job_url.

        Returns:
            Dict with extracted job fields, or None if the section doesn't contain a job.
        """
        if len(section) < 20:
            return None

        lines = [line.strip() for line in section.split("\n") if line.strip()]
        if not lines:
            return None

        # Try to identify job-related content
        job_title = "N/A"
        company = "N/A"
        location = "N/A"
        salary = "N/A"
        skills = "N/A"
        job_url = source_url
        posted_date = "N/A"

        for line in lines:
            clean_line = re.sub(r"[*_#\[\]]", "", line).strip()

            # Detect salary patterns: "$80k - $120k", "₹10L - ₹20L", etc.
            if re.search(r"[\$₹€£]\s*[\d,]+[kKlLmM]?\s*[-–—]\s*[\$₹€£]?\s*[\d,]+[kKlLmM]?", clean_line):
                salary = clean_line
                continue

            # Detect location patterns: city names, "Remote", etc.
            if re.search(r"\b(remote|hybrid|on-?site|bangalore|mumbai|delhi|hyderabad|pune|chennai|india|usa|uk|san francisco|new york)\b", clean_line, re.I):
                if location == "N/A":
                    location = clean_line
                continue

            # Detect skills/tech stack
            if re.search(r"\b(python|java|react|node|aws|sql|javascript|typescript|docker|kubernetes)\b", clean_line, re.I):
                if skills == "N/A":
                    skills = clean_line
                continue

            # Detect URLs
            url_match = re.search(r"(https?://[^\s\)]+)", line)
            if url_match and "wellfound.com" in url_match.group(1):
                job_url = url_match.group(1)
                continue

            # First substantial text line is likely the company or job title
            if len(clean_line) > 3:
                if company == "N/A":
                    company = clean_line
                elif job_title == "N/A":
                    job_title = clean_line

        # Only return if we found at least a title or company
        if job_title == "N/A" and company == "N/A":
            return None

        return {
            "job_title": job_title,
            "company": company,
            "location": location,
            "salary": salary,
            "experience": "N/A",
            "skills": skills,
            "job_url": job_url,
            "posted_date": posted_date,
        }

    def _parse_jobs_line_by_line(self, markdown: str, source_url: str) -> list[dict]:
        """
        Fallback parser: scan markdown line by line to find job listing patterns.

        Looks for sequences of lines that together describe a job (company name
        followed by title, salary, location, etc.).

        Args:
            markdown: Full markdown content.
            source_url: Fallback URL.

        Returns:
            List of raw job dicts.
        """
        jobs = []
        lines = markdown.split("\n")
        current_job = {}
        line_count = 0

        for line in lines:
            clean = line.strip()
            if not clean:
                # Empty line might separate job listings
                if current_job.get("job_title") or current_job.get("company"):
                    current_job.setdefault("job_title", "N/A")
                    current_job.setdefault("company", "N/A")
                    current_job.setdefault("location", "N/A")
                    current_job.setdefault("salary", "N/A")
                    current_job.setdefault("experience", "N/A")
                    current_job.setdefault("skills", "N/A")
                    current_job.setdefault("job_url", source_url)
                    current_job.setdefault("posted_date", "N/A")
                    jobs.append(current_job)
                    current_job = {}
                    line_count = 0
                continue

            # Remove markdown formatting
            text = re.sub(r"[*_#\[\]]", "", clean).strip()
            if not text:
                continue

            line_count += 1

            # Heuristic: detect salary
            if re.search(r"[\$₹€£]\s*[\d,]+", text):
                current_job["salary"] = text
            # Detect URLs
            elif re.search(r"https?://.*wellfound", text):
                url_match = re.search(r"(https?://[^\s\)]+)", text)
                if url_match:
                    current_job["job_url"] = url_match.group(1)
            # First line is likely company, second is title
            elif line_count == 1 and "company" not in current_job:
                current_job["company"] = text
            elif line_count == 2 and "job_title" not in current_job:
                current_job["job_title"] = text
            # Detect location
            elif re.search(r"\b(remote|hybrid|bangalore|mumbai|delhi|hyderabad|pune|india)\b", text, re.I):
                current_job["location"] = text

        # Don't forget the last job
        if current_job.get("job_title") or current_job.get("company"):
            current_job.setdefault("job_title", "N/A")
            current_job.setdefault("company", "N/A")
            current_job.setdefault("location", "N/A")
            current_job.setdefault("salary", "N/A")
            current_job.setdefault("experience", "N/A")
            current_job.setdefault("skills", "N/A")
            current_job.setdefault("job_url", source_url)
            current_job.setdefault("posted_date", "N/A")
            jobs.append(current_job)

        return jobs
