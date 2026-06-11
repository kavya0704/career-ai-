import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/careerai?schema=public"
    REDIS_URL: str = "redis://localhost:6379"
    SCRAPER_SERVICE_API_KEY: str = "careerai_internal_secret_key_987"
    FIRECRAWL_API_KEY: str = ""
    MAX_PAGES: int = 3

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Module-level scraper configurations
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]

REQUEST_DELAY_MIN = 1.0
REQUEST_DELAY_MAX = 3.0
REQUEST_TIMEOUT = 15
MAX_PAGES = settings.MAX_PAGES

WELLFOUND_BASE_URL = "https://wellfound.com/role/l/{}"
REMOTEOK_API_URL = "https://remoteok.com/api"
NAUKRI_URL_WITH_LOCATION = "https://www.naukri.com/{slug}-jobs-in-{location}"
NAUKRI_URL_WITHOUT_LOCATION = "https://www.naukri.com/{slug}-jobs"

FIRECRAWL_API_KEY = settings.FIRECRAWL_API_KEY

