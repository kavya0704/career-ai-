from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from worker import run_scrape_job
from config import settings

app = FastAPI(title="CareerAI Scraper Service")

class SearchRequest(BaseModel):
    role: str
    location: Optional[str] = ""
    experience: Optional[str] = ""
    session_id: str
    user_id: str
    skills: Optional[List[str]] = []

@app.post("/scrape")
async def trigger_scrape(
    req: SearchRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None, alias="X-API-KEY")
):
    # Validate internal API key
    if x_api_key != settings.SCRAPER_SERVICE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

    # Queue job in background tasks
    background_tasks.add_task(run_scrape_job, req.dict())
    return {"status": "queued", "session_id": req.session_id}

@app.get("/health")
async def health():
    return {"status": "ok", "scrapers": ["remoteok", "naukri", "wellfound"]}
