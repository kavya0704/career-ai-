import asyncio
import json
import logging
from redis import Redis
from scrapers.remoteok_scraper import RemoteOKScraper
from scrapers.naukri_scraper import NaukriScraper
from scrapers.wellfound_scraper import WellfoundScraper
from utils.data_cleaner import clean_and_deduplicate
from utils.relevance_scorer import score_relevance
from db import upsert_jobs
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_scrape_job(job_data: dict):
    role = job_data["role"]
    location = job_data.get("location", "")
    session_id = job_data["session_id"]
    user_id = job_data["user_id"]
    user_skills = job_data.get("skills", [])

    logger.info(f"Starting scrape job for role: {role}, location: {location}, session_id: {session_id}")

    remoteok = RemoteOKScraper()
    naukri = NaukriScraper()
    wellfound = WellfoundScraper()

    try:
        # Run all 3 scrapers in parallel in threads
        tasks = [
            asyncio.to_thread(remoteok.scrape, role, location),
            asyncio.to_thread(naukri.scrape, role, location),
            asyncio.to_thread(wellfound.scrape, role, location)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
    finally:
        # Close connection pools/browsers inside the scrapers
        for scraper in [remoteok, naukri, wellfound]:
            try:
                scraper.close()
            except Exception as e:
                logger.error(f"Error closing scraper {scraper.source_name}: {e}")

    all_jobs = []
    sources = ["RemoteOK", "Naukri", "Wellfound"]
    for source_name, result in zip(sources, results):
        if isinstance(result, Exception):
            logger.error(f"{source_name} scraper failed with exception: {result}", exc_info=True)
            continue
        logger.info(f"{source_name} found {len(result)} raw jobs")
        all_jobs.extend(result)

    # Clean & Deduplicate
    logger.info(f"Total raw jobs found: {len(all_jobs)}")
    cleaned = clean_and_deduplicate(all_jobs)
    logger.info(f"Total cleaned unique jobs: {len(cleaned)}")

    # Score relevance against user skills
    scored = [score_relevance(job, user_skills, role) for job in cleaned]
    sorted_jobs = sorted(scored, key=lambda j: j["relevance_score"], reverse=True)

    # Write to PostgreSQL database (upserting jobs and user jobs)
    logger.info(f"Writing {len(sorted_jobs)} jobs to PostgreSQL database...")
    await asyncio.to_thread(upsert_jobs, sorted_jobs, session_id, user_id)
    logger.info("Database write completed.")

    # Notify Next.js via Redis Pub/Sub
    try:
        r = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        event_payload = {
            "status": "complete",
            "count": len(sorted_jobs)
        }
        r.publish(f"search:{session_id}", json.dumps(event_payload))
        logger.info(f"Published completion notification to Redis channel 'search:{session_id}'")
    except Exception as e:
        logger.error(f"Failed to publish completion event to Redis: {e}")
