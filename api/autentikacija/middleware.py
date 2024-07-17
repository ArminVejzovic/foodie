from fastapi import Request, HTTPException, status, Depends
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from models.models import Admin, RestaurantAdmin, Deliverer, Customer
from database.database import get_db
from autentikacija.autentikacija import SECRET_KEY, ALGORITHM, get_user_by_username
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = await oauth2_scheme(request)
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
    return user

def check_role(required_roles):
    def role_checker(user: Customer):
        if user.__class__.__name__ not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return user
    return role_checker

def admin_required(user: Admin = Depends(get_current_user)):
    return check_role(['Admin'])(user)

def restaurant_admin_required(user: RestaurantAdmin = Depends(get_current_user)):
    return check_role(['RestaurantAdmin'])(user)

def deliverer_required(user: Deliverer = Depends(get_current_user)):
    return check_role(['Deliverer'])(user)
