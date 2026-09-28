from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Configure engine for SQLite or PostgreSQL
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_ai_report_columns():
    """Add AI report storage to existing local databases without dropping data."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table_name in ("resume_analyses", "job_matches"):
            if table_name not in inspector.get_table_names():
                continue
            columns = {column["name"] for column in inspector.get_columns(table_name)}
            if "ai_report" not in columns:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN ai_report JSON"))

def ensure_resume_editor_columns():
    """Add editable-import and version metadata to existing resume tables."""
    inspector = inspect(engine)
    if "resumes" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("resumes")}
    definitions = {
        "version_group_id": "INTEGER",
        "version_number": "INTEGER NOT NULL DEFAULT 1",
        "source_filename": "VARCHAR",
        "source_file_path": "VARCHAR",
        "section_order": "JSON",
        "interests": "JSON",
    }
    with engine.begin() as connection:
        for name, definition in definitions.items():
            if name not in columns:
                connection.execute(text(f"ALTER TABLE resumes ADD COLUMN {name} {definition}"))

def get_db():
    """Dependency that provides a database session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
