from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from database.database import SessionLocal, test_db_connection

def start_application():
    app = FastAPI()
    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    return app

app = start_application()

def get_db():
    db_instance = SessionLocal()
    try:
        yield db_instance
    finally:
        db_instance.close()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/test_db")
def test_db(db: Session = Depends(get_db)):
    if test_db_connection():
        return {"message": "Database connected successfully"}
    else:
        return {"message": "Database connection failed"}
