from fastapi import FastAPI, Depends, HTTPException, status
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional
from utils.hashing import verify_password, get_password_hash
from models import models
from autentikacija.middleware import admin_required, restaurant_admin_required
from models.models import Admin, Customer, Deliverer, RestaurantAdmin
from autentikacija.autentikacija import create_access_token, get_current_user, get_user_by_username
from schemas.schemas import AdminCreate, DelivererCreate, RestaurantAdminCreate, Token, CustomerCreate
from database.database import get_db, engine

models.Base.metadata.create_all(bind=engine)

def start_application():
    app = FastAPI()
    
    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app

app = start_application()

def is_username_taken(db: Session, username: str) -> bool:
    return db.query(Admin).filter(Admin.username == username).first() or \
           db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first() or \
           db.query(Deliverer).filter(Deliverer.username == username).first() or \
           db.query(Customer).filter(Customer.username == username).first()

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register/customer")
def register_customer(user: CustomerCreate, db: Session = Depends(get_db)):
    if is_username_taken(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )
    hashed_password = get_password_hash(user.password)
    db_user = Customer(
        username=user.username,
        email=user.email,
        password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        address=user.address,
        latitude=user.latitude,
        longitude=user.longitude,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/get-password")
def index():
    passw = "admin123"
    return {"password": get_password_hash(passw)}

@app.post("/create_admin")
def create_admin(user: AdminCreate, db: Session = Depends(get_db)):
    if is_username_taken(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )
    hashed_password = get_password_hash(user.password)
    db_user = Admin(
        username=user.username,
        email=user.email,
        password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/create_restaurant_admin")
def create_restaurant_admin(user: RestaurantAdminCreate, db: Session = Depends(get_db)):
    if is_username_taken(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )
    hashed_password = get_password_hash(user.password)
    db_user = RestaurantAdmin(
        username=user.username,
        email=user.email,
        password=hashed_password,
        restaurant_id=user.restaurant_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/create_deliverer")
def create_deliverer(user: DelivererCreate, db: Session = Depends(get_db)):
    if is_username_taken(db, user.username):
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )
    hashed_password = get_password_hash(user.password)
    db_user = Deliverer(
        username=user.username,
        email=user.email,
        password=hashed_password,
        restaurant_id=user.restaurant_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/get-role/{username}")
def get_role(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    return {"role": user.role}
