from datetime import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from models.models import ActiveSession, Admin, RestaurantAdmin, Deliverer, Customer
from database.database import get_db
from utils.hashing import verify_password
from schemas.schemas import Token
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, db: Session):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    existing_session = db.query(ActiveSession).filter(ActiveSession.username == data["sub"]).first()
    
    if existing_session:
        db.delete(existing_session)
        db.commit()

    new_session = ActiveSession(username=data['sub'], token=encoded_jwt, created_at=datetime.utcnow())
    db.add(new_session)
    db.commit()

    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    user = db.query(Admin).filter(Admin.username == username).first() or \
           db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first() or \
           db.query(Deliverer).filter(Deliverer.username == username).first() or \
           db.query(Customer).filter(Customer.username == username).first()
    return user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return {"username": user.username, "role": user.role}

async def login_for_access_token(form_data: OAuth2PasswordRequestForm, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    role = user.__class__.__name__
    access_token = create_access_token(data={"sub": user.username, "role": role})
    return Token(access_token=access_token, token_type="bearer")


