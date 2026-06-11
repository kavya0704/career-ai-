import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ARRAY, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import insert
from config import settings

# Adjust DATABASE_URL schema for SQLAlchemy
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Job(Base):
    __tablename__ = 'Job'

    id = Column(String, primary_key=True)
    jobTitle = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    skills = Column(ARRAY(String), nullable=False, default=[])
    jobUrl = Column(String, nullable=False)
    fullDescription = Column(String, nullable=True)
    postedDate = Column(String, nullable=True)
    source = Column(String, nullable=False)
    relevanceScore = Column(Integer, nullable=False, default=0)
    scrapedAt = Column(DateTime, nullable=False, default=datetime.utcnow)

class UserJob(Base):
    __tablename__ = 'UserJob'

    id = Column(String, primary_key=True)
    userId = Column(String, nullable=False)
    jobId = Column(String, ForeignKey('Job.id'), nullable=False)
    status = Column(String, nullable=False, default="saved")
    notes = Column(String, nullable=True)
    appliedAt = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    updatedAt = Column(DateTime, nullable=False, default=datetime.utcnow)

class SearchSession(Base):
    __tablename__ = 'SearchSession'

    id = Column(String, primary_key=True)
    userId = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)
    status = Column(String, nullable=False, default="queued")
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)

def generate_cuid():
    # Helper to generate a unique ID matching cuid length and prefix
    return f"c{uuid.uuid4().hex[:24]}"

def upsert_jobs(jobs: list[dict], session_id: str, user_id: str):
    session = SessionLocal()
    try:
        # 1. Update SearchSession to active
        session.query(SearchSession).filter(SearchSession.id == session_id).update({
            "status": "active"
        })
        session.commit()

        for job_data in jobs:
            job_id = generate_cuid()
            # Process skills into a list of strings if it is currently a comma-separated string
            skills_raw = job_data.get("skills", "")
            if isinstance(skills_raw, str):
                skills_list = [s.strip() for s in skills_raw.split(",") if s.strip() and s.strip().upper() != "N/A"]
            elif isinstance(skills_raw, list):
                skills_list = skills_raw
            else:
                skills_list = []

            # Prepare Job Upsert statement
            stmt = insert(Job).values(
                id=job_id,
                jobTitle=job_data.get("job_title", "Unknown Role"),
                company=job_data.get("company", "Unknown Company"),
                location=job_data.get("location"),
                salary=job_data.get("salary"),
                experience=job_data.get("experience"),
                skills=skills_list,
                jobUrl=job_data["job_url"],
                fullDescription=job_data.get("full_description") or job_data.get("description"),
                postedDate=job_data.get("posted_date"),
                source=job_data.get("source", "unknown"),
                relevanceScore=job_data.get("relevance_score", 0),
                scrapedAt=datetime.utcnow()
            )

            # On conflict: update everything except primary key 'id'
            stmt = stmt.on_conflict_do_update(
                index_elements=['jobUrl', 'source'],
                set_={
                    'jobTitle': stmt.excluded.jobTitle,
                    'company': stmt.excluded.company,
                    'location': stmt.excluded.location,
                    'salary': stmt.excluded.salary,
                    'experience': stmt.excluded.experience,
                    'skills': stmt.excluded.skills,
                    'fullDescription': stmt.excluded.fullDescription,
                    'postedDate': stmt.excluded.postedDate,
                    'relevanceScore': stmt.excluded.relevanceScore,
                    'scrapedAt': stmt.excluded.scrapedAt
                }
            ).returning(Job.id)

            # Execute statement and get the final job ID
            res = session.execute(stmt)
            job_db_id = res.scalar_one()

            # 2. Insert UserJob
            user_job_id = generate_cuid()
            user_job_stmt = insert(UserJob).values(
                id=user_job_id,
                userId=user_id,
                jobId=job_db_id,
                status="saved",
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            ).on_conflict_do_nothing(
                index_elements=['userId', 'jobId']
            )
            session.execute(user_job_stmt)

        # 3. Update SearchSession to completed
        session.query(SearchSession).filter(SearchSession.id == session_id).update({
            "status": "completed"
        })
        session.commit()
    except Exception as e:
        session.rollback()
        # Update session status to failed
        try:
            session.query(SearchSession).filter(SearchSession.id == session_id).update({
                "status": "failed"
            })
            session.commit()
        except:
            pass
        raise e
    finally:
        session.close()
