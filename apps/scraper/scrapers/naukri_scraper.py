"""
AI Job Agent — Naukri Scraper

Scrapes job listings from Naukri.com using requests + BeautifulSoup.
Builds location-aware search URLs and parses job cards from the HTML response.
"""

import re
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

import config
from scrapers.base_scraper import BaseScraper


class NaukriScraper(BaseScraper):
    """
    Scraper for Naukri.com using HTML scraping (requests + BeautifulSoup).

    Constructs SEO-friendly search URLs based on the job title and
    optional location, then parses job card HTML to extract listings.
    """

    def __init__(self):
        super().__init__(source_name="Naukri")
        # Naukri expects browser-like headers
        self.session.headers["Accept-Encoding"] = "gzip, deflate"
        self.session.headers["Referer"] = "https://www.naukri.com/"

    def scrape(self, job_title: str, location: str = "") -> list[dict]:
        """
        Scrape Naukri.com for jobs matching the title and optional location.

        Args:
            job_title: The job title to search for (e.g., "product manager").
            location:  Optional city/location (e.g., "bangalore").

        Returns:
            List of normalized job dictionaries.
        """
        self.logger.info(
            "Starting Naukri scrape for: '%s'%s",
            job_title,
            f" in '{location}'" if location else "",
        )

        all_jobs = []
        for page_num in range(1, config.MAX_PAGES + 1):
            url = self._build_url(job_title, location, page_num)
            self.logger.info("Scraping page %d: %s", page_num, url)

            response = self.safe_get(url)
            if response is None:
                self.logger.warning("Failed to fetch page %d — stopping pagination", page_num)
                break

            jobs_on_page = self._parse_jobs(response.text)
            if not jobs_on_page:
                self.logger.info("No jobs found on page %d — stopping pagination", page_num)
                break

            all_jobs.extend(jobs_on_page)
            self.logger.info("Page %d: extracted %d jobs", page_num, len(jobs_on_page))

            # Don't delay after the last page
            if page_num < config.MAX_PAGES:
                self.random_delay()

        # Normalize all collected jobs
        normalized_jobs = [self.normalize(job) for job in all_jobs]
        self.logger.info(
            "Naukri: Total %d jobs found for '%s'%s",
            len(normalized_jobs), job_title,
            f" in '{location}'" if location else "",
        )
        return normalized_jobs

    def _build_url(self, job_title: str, location: str, page: int) -> str:
        """
        Build the Naukri search URL from job title, location, and page number.

        Examples:
            ("product manager", "bangalore", 1)
            → https://www.naukri.com/product-manager-jobs-in-bangalore?k=product+manager&l=bangalore&pageNo=1

            ("python developer", "", 1)
            → https://www.naukri.com/python-developer-jobs?k=python+developer&pageNo=1
        """
        # Create URL slug: "product manager" → "product-manager"
        slug = re.sub(r"\s+", "-", job_title.strip().lower())

        if location:
            loc_slug = re.sub(r"\s+", "-", location.strip().lower())
            base_url = config.NAUKRI_URL_WITH_LOCATION.format(slug=slug, location=loc_slug)
            params = f"?k={quote_plus(job_title)}&l={quote_plus(location)}&pageNo={page}"
        else:
            base_url = config.NAUKRI_URL_WITHOUT_LOCATION.format(slug=slug)
            params = f"?k={quote_plus(job_title)}&pageNo={page}"

        return base_url + params

    def _parse_jobs(self, html: str) -> list[dict]:
        """
        Parse the Naukri HTML response and extract job card data.

        Uses multiple CSS selector strategies as fallbacks since
        Naukri periodically changes its class names.

        Args:
            html: Raw HTML string from Naukri search results page.

        Returns:
            List of raw job dicts (not yet normalized).
        """
        soup = BeautifulSoup(html, "lxml")
        jobs = []

        # Strategy 1: Look for job tuple wrappers (most common structure)
        job_cards = soup.find_all("div", class_=re.compile(r"srp-jobtuple-wrapper|jobTuple", re.I))

        # Strategy 2: Fallback — look for article tags with job data
        if not job_cards:
            job_cards = soup.find_all("article", class_=re.compile(r"jobTuple|job-card", re.I))

        # Strategy 3: Fallback — look for div with data attributes
        if not job_cards:
            job_cards = soup.find_all("div", attrs={"data-job-id": True})

        if not job_cards:
            self.logger.debug("No job cards found in HTML (page may be JS-rendered or blocked)")
            return []

        for card in job_cards:
            job = self._extract_job_from_card(card)
            if job and job.get("job_title", "N/A") != "N/A":
                jobs.append(job)

        return jobs

    def _extract_job_from_card(self, card) -> dict:
        """
        Extract job data from a single Naukri job card HTML element.

        Uses multiple selector strategies with fallbacks for robustness.

        Args:
            card: BeautifulSoup Tag representing a single job card.

        Returns:
            Dict with extracted job fields.
        """
        # Job Title — look for title links
        title_elem = (
            card.find("a", class_=re.compile(r"title", re.I))
            or card.find("a", class_=re.compile(r"jobTitle", re.I))
            or card.find("a", attrs={"class": re.compile(r"fw500", re.I)})
        )
        job_title = title_elem.get_text(strip=True) if title_elem else "N/A"
        job_url = title_elem.get("href", "N/A") if title_elem else "N/A"

        # Company Name
        company_elem = (
            card.find("a", class_=re.compile(r"comp-name|companyName|subTitle", re.I))
            or card.find("span", class_=re.compile(r"comp-name|companyName", re.I))
        )
        company = company_elem.get_text(strip=True) if company_elem else "N/A"

        # Experience
        exp_elem = (
            card.find("span", class_=re.compile(r"exp-wrap|expwrap|experience", re.I))
            or card.find("li", class_=re.compile(r"exp", re.I))
        )
        experience = exp_elem.get_text(strip=True) if exp_elem else "N/A"

        # Salary
        salary_elem = (
            card.find("span", class_=re.compile(r"sal-wrap|salwrap|salary", re.I))
            or card.find("li", class_=re.compile(r"sal", re.I))
        )
        salary = salary_elem.get_text(strip=True) if salary_elem else "N/A"

        # Location
        loc_elem = (
            card.find("span", class_=re.compile(r"loc-wrap|locwrap|location|loc$", re.I))
            or card.find("li", class_=re.compile(r"loc", re.I))
        )
        location = loc_elem.get_text(strip=True) if loc_elem else "N/A"

        # Skills / Tags
        skill_elems = card.find_all("li", class_=re.compile(r"tag|skill|dot-gt", re.I))
        if not skill_elems:
            skill_elems = card.find_all("span", class_=re.compile(r"tag|skill", re.I))
        skills = ", ".join(s.get_text(strip=True) for s in skill_elems) if skill_elems else "N/A"

        # Posted Date
        date_elem = (
            card.find("span", class_=re.compile(r"job-post-day|postday|date", re.I))
            or card.find("span", class_=re.compile(r"ago", re.I))
        )
        posted_date = date_elem.get_text(strip=True) if date_elem else "N/A"

        return {
            "job_title": job_title,
            "company": company,
            "location": location,
            "salary": salary,
            "experience": experience,
            "skills": skills,
            "job_url": job_url,
            "posted_date": posted_date,
        }
