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
from models.models import Admin, Customer, Deliverer, FoodItem, FoodType, Menu, Order, Restaurant, RestaurantAdmin, RestaurantType
from autentikacija.autentikacija import ALGORITHM, SECRET_KEY, create_access_token, get_current_user, get_user_by_username, oauth2_scheme
from schemas.schemas import AdminCreate, DelivererCreate, FoodItemCreate, FoodTypeCreate, MenuCreate, RestaurantAdminCreate, RestaurantCreate, RestaurantTypeCreate, RestaurantUpdate, Token, CustomerCreate
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

@app.get("/validate-token")
async def validate_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    return {"valid": True}

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

#--------------
# Admin
#--------------

@app.post("/restaurants")
def create_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    db_restaurant = Restaurant(
        name=restaurant.name,
        latitude=restaurant.latitude,
        longitude=restaurant.longitude,
        street=restaurant.street,
        city=restaurant.city,
        stars=restaurant.stars,
        category=restaurant.category,
        distance_limit=restaurant.distance_limit,
        is_active=restaurant.is_active
    )
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.put("/restaurants/{restaurant_id}")
def update_restaurant(restaurant_id: int, restaurant: RestaurantUpdate, db: Session = Depends(get_db)):
    db_restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    for key, value in restaurant.dict().items():
        setattr(db_restaurant, key, value)
    
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.put("/restaurants/{restaurant_id}/archive")
def archive_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    db_restaurant.is_active = False
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.get("/restaurants")
def get_all_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).all()

@app.get("/restaurants/active")
def get_active_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == True).all()

@app.get("/restaurants/archived")
def get_archived_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == False).all()

@app.put("/restaurants/{restaurant_id}/restore")
def restore_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db_restaurant.is_active = True
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.get("/active/restaurants")
def get_all_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == True).all()

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

@app.post("/food_types/")
def create_food_type(food_type: FoodTypeCreate, db: Session = Depends(get_db)):
    db_food_type = db.query(FoodType).filter(FoodType.name == food_type.name).first()
    if db_food_type:
        raise HTTPException(status_code=400, detail="Food type already exists")
    new_food_type = FoodType(name=food_type.name)
    db.add(new_food_type)
    db.commit()
    db.refresh(new_food_type)
    return new_food_type

@app.get("/food_types/")
def read_food_types(db: Session = Depends(get_db)):
    return db.query(FoodType).all()

@app.get("/food_types/{food_type_id}")
def read_food_type(food_type_id: int, db: Session = Depends(get_db)):
    return db.query(FoodType).filter(FoodType.id == food_type_id).first()

@app.put("/food_types/{food_type_id}")
def update_food_type(food_type_id: int, food_type: FoodTypeCreate, db: Session = Depends(get_db)):
    db_food_type = db.query(FoodType).filter(FoodType.id == food_type_id).first()
    if not db_food_type:
        raise HTTPException(status_code=404, detail="Food type not found")
    db_food_type.name = food_type.name
    db.commit()
    db.refresh(db_food_type)
    return db_food_type

@app.delete("/food_types/{food_type_id}")
def delete_food_type(food_type_id: int, db: Session = Depends(get_db)):
    db_food_type = db.query(FoodType).filter(FoodType.id == food_type_id).first()
    if not db_food_type:
        raise HTTPException(status_code=404, detail="Food type not found")
    db.delete(db_food_type)
    db.commit()
    return db_food_type

# CRUD for RestaurantType
@app.post("/restaurant_types/")
def create_restaurant_type(restaurant_type: RestaurantTypeCreate, db: Session = Depends(get_db)):
    db_restaurant_type = db.query(RestaurantType).filter(RestaurantType.name == restaurant_type.name).first()
    if db_restaurant_type:
        raise HTTPException(status_code=400, detail="Restaurant type already exists")
    new_restaurant_type = RestaurantType(name=restaurant_type.name)
    db.add(new_restaurant_type)
    db.commit()
    db.refresh(new_restaurant_type)
    return new_restaurant_type

@app.get("/restaurant_types/")
def read_restaurant_types(db: Session = Depends(get_db)):
    return db.query(RestaurantType).all()

@app.get("/restaurant_types/{restaurant_type_id}")
def read_restaurant_type(restaurant_type_id: int, db: Session = Depends(get_db)):
    return db.query(RestaurantType).filter(RestaurantType.id == restaurant_type_id).first()

@app.put("/restaurant_types/{restaurant_type_id}")
def update_restaurant_type(restaurant_type_id: int, restaurant_type: RestaurantTypeCreate, db: Session = Depends(get_db)):
    db_restaurant_type = db.query(RestaurantType).filter(RestaurantType.id == restaurant_type_id).first()
    if not db_restaurant_type:
        raise HTTPException(status_code=404, detail="Restaurant type not found")
    db_restaurant_type.name = restaurant_type.name
    db.commit()
    db.refresh(db_restaurant_type)
    return db_restaurant_type

@app.delete("/restaurant_types/{restaurant_type_id}")
def delete_restaurant_type(restaurant_type_id: int, db: Session = Depends(get_db)):
    db_restaurant_type = db.query(RestaurantType).filter(RestaurantType.id == restaurant_type_id).first()
    if not db_restaurant_type:
        raise HTTPException(status_code=404, detail="Restaurant type not found")
    db.delete(db_restaurant_type)
    db.commit()
    return db_restaurant_type


@app.get("/all_restaurants")
def get_all_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).all()


@app.get("/all_menus")
def get_all_menus(db: Session = Depends(get_db)):
    return db.query(Menu).all()


@app.get("/all_orders")
def get_all_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.get("/all_customers")
def get_all_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@app.get("/all_deliverers")
def get_all_deliverers(db: Session = Depends(get_db)):
    return db.query(Deliverer).all()

#--------------
# Restaurant Admin
#--------------

#1.

# FoodItem CRUD
@app.post("/food_items")
def create_food_item(food_item: FoodItemCreate, db: Session = Depends(get_db)):
    db_food_item = models.FoodItem(**food_item.dict())
    db.add(db_food_item)
    db.commit()
    db.refresh(db_food_item)
    return db_food_item

@app.get("/food_items")
def read_food_items(db: Session = Depends(get_db)):
    return db.query(FoodItem).all()

@app.get("/food_items/{food_item_id}")
def read_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if db_food_item is None:
        raise HTTPException(status_code=404, detail="Food item not found")
    return db_food_item

@app.put("/food_items/{food_item_id}")
def update_food_item(food_item_id: int, food_item: FoodItemCreate, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if db_food_item is None:
        raise HTTPException(status_code=404, detail="Food item not found")
    for key, value in food_item.dict().items():
        setattr(db_food_item, key, value)
    db.commit()
    db.refresh(db_food_item)
    return db_food_item

@app.delete("/food_items/{food_item_id}", response_model=FoodItem)
def delete_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(models.FoodItem).filter(models.FoodItem.id == food_item_id).first()
    if db_food_item is None:
        raise HTTPException(status_code=404, detail="Food item not found")
    db.delete(db_food_item)
    db.commit()
    return db_food_item

# Menu CRUD
@app.post("/menus", response_model=schemas.Menu)
def create_menu(menu: schemas.MenuCreate, db: Session = Depends(get_db)):
    db_menu = models.Menu(**menu.dict(exclude={"item_ids"}))
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    for item_id in menu.item_ids:
        db_menu_fooditem = models.MenuFoodItem(menu_id=db_menu.id, fooditem_id=item_id)
        db.add(db_menu_fooditem)
    db.commit()
    db.refresh(db_menu)
    return db_menu

@app.get("/menus", response_model=List[schemas.Menu])
def read_menus(db: Session = Depends(get_db)):
    return db.query(models.Menu).all()

@app.get("/menus/{menu_id}", response_model=schemas.Menu)
def read_menu(menu_id: int, db: Session = Depends(get_db)):
    db_menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if db_menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    return db_menu

@app.put("/menus/{menu_id}", response_model=schemas.Menu)
def update_menu(menu_id: int, menu: schemas.MenuCreate, db: Session = Depends(get_db)):
    db_menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if db_menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    for key, value in menu.dict(exclude={"item_ids"}).items():
        setattr(db_menu, key, value)
    db.commit()
    db.refresh(db_menu)
    db.query(models.MenuFoodItem).filter(models.MenuFoodItem.menu_id == menu_id).delete()
    for item_id in menu.item_ids:
        db_menu_fooditem = models.MenuFoodItem(menu_id=menu_id, fooditem_id=item_id)
        db.add(db_menu_fooditem)
    db.commit()
    db.refresh(db_menu)
    return db_menu

@app.delete("/menus/{menu_id}", response_model=schemas.Menu)
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    db_menu = db.query(models.Menu).filter(models.Menu.id == menu_id).first()
    if db_menu is None:
        raise HTTPException(status_code=404, detail="Menu not found")
    db.query(models.MenuFoodItem).filter(models.MenuFoodItem.menu_id == menu_id).delete()
    db.delete(db_menu)
    db.commit()
    return db_menu