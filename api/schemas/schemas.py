
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: str

class CustomerCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    address: str
    latitude: float
    longitude: float

class AdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class RestaurantAdminCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    restaurant_id: int

class DelivererCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    restaurant_id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None
