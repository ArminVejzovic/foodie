
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: str

class ApplyDeliverer(BaseModel):
    name: str
    email: EmailStr
    phone: str

class ApplyPartner(BaseModel):
    name: str
    email: EmailStr
    phone: str


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

class RestaurantCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    street: str
    city: str
    stars: int
    category: str
    distance_limit: float
    is_active: bool = True

class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    street: Optional[str] = None
    city: Optional[str] = None
    stars: Optional[int] = None
    category: Optional[str] = None
    distance_limit: Optional[float] = None

class FoodTypeCreate(BaseModel):
    name: str

class RestaurantTypeCreate(BaseModel):
    name: str

class FoodItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    discount_start: Optional[datetime] = None
    discount_end: Optional[datetime] = None
    discount_price: Optional[float] = None
    type_id: int
    restaurant_id: int
    is_active: Optional[bool] = True

class FoodItemUpdate(FoodItemCreate):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    discount_start: Optional[datetime] = None
    discount_end: Optional[datetime] = None
    discount_price: Optional[float] = None
    type_id: Optional[int] = None
    restaurant_id: Optional[int] = None

class ApproveOrderRequest(BaseModel):
    status: str

class AssignOrderRequest(BaseModel):
    deliverer_id: int

class DelivererResponse(BaseModel):
    id: int
    username: str

class StatusUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    status: str
    total_price: float
    deliverer_id: int | None
    deliverer_username: str | None
    delivery_time: str = None

class OrderItemCreate(BaseModel):
    food_item_id: int
    quantity: int

class OrderCreate(BaseModel):
    cart: list[OrderItemCreate]
    payment_method: str
    delivery_time: str = None

class RequestPasswordResetSchema(BaseModel):
    username: str
    email: EmailStr
    role: str

class VerifyResetCodeSchema(BaseModel):
    username: str
    email: EmailStr
    role: str
    reset_code: str

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str
    username: str
    email: str
    role: str

class RatingCreate(BaseModel):
    rating: int
    comment: Optional[str]

    class Config:
        from_attributes = True

class TokenData(BaseModel):
    token: str
