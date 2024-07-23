
from datetime import datetime
from typing import List, Optional
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

# Admin

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

class FoodItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    discount_start: Optional[datetime] = None
    discount_end: Optional[datetime] = None
    discount_price: Optional[float] = None
    type_id: int
    restaurant_id: int
    is_active: Optional[bool] = True

class FoodItemCreate(FoodItemBase):
    pass

class FoodItem(FoodItemBase):
    id: int

    class Config:
        orm_mode = True

class MenuBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    discount_start: Optional[datetime] = None
    discount_end: Optional[datetime] = None
    discount_price: Optional[float] = None
    restaurant_id: int
    is_group: Optional[bool] = False
    is_active: Optional[bool] = True

class MenuCreate(MenuBase):
    item_ids: List[int] = []

class Menu(MenuBase):
    id: int
    food_items: List[FoodItem] = []

    class Config:
        orm_mode = True