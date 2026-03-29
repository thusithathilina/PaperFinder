import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

# Default: data/ directory relative to where the app runs (project root in Docker)
# Override by setting DB_PATH environment variable
DEFAULT_DB_DIR = Path("/app/data")  # inside container
_db_path = os.getenv("DB_PATH")

if _db_path:
    db_file = Path(_db_path)
else:
    # In Docker the workdir is /app, so /app/data maps to ./data on the host
    # In local dev (uvicorn from backend/), fall back to ./data relative to cwd
    db_file = Path(os.getenv("DATA_DIR", "data")) / "library.db"

# Make sure the directory exists
db_file.parent.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{db_file}"
print(f"  Database: {db_file.resolve()}")

engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
