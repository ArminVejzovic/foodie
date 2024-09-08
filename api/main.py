import base64
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import math
import smtplib
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import desc, func
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import date, datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from utils.hashing import verify_password, get_password_hash
from models import models
from models.models import ActiveSession, Admin, Customer, Deliverer, FoodItem, FoodType, Menu, Notification, Order, OrderFoodItem, Rating, Restaurant, RestaurantAdmin, RestaurantType
from autentikacija.autentikacija import ALGORITHM, SECRET_KEY, create_access_token, get_current_user, get_user_by_username, oauth2_scheme
from schemas.schemas import AdminCreate, ApplyDeliverer, ApplyPartner, ApproveOrderRequest, AssignOrderRequest, DelivererCreate, DelivererResponse, FoodItemCreate, FoodItemUpdate, FoodTypeCreate, OrderCreate, OrderResponse, RatingCreate, RequestPasswordResetSchema, ResetPasswordSchema, RestaurantAdminCreate, RestaurantCreate, RestaurantTypeCreate, RestaurantUpdate, StatusUpdate, CustomerCreate, TokenData
from database.database import get_db, engine
from sqlalchemy.orm import joinedload
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import os

load_dotenv()

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

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

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
    access_token = create_access_token(data={"sub": user.username}, db=db)
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

@app.get("/get-password")
def index():
    passw = "admin123"
    return {"password": get_password_hash(passw)}

@app.get("/get-role/{username}")
def get_role(username: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    return {"role": user.role}


@app.post("/logout")
def logout(token_data: TokenData, db: Session = Depends(get_db)):
    try:
        token = token_data.token
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        session = db.query(ActiveSession).filter(ActiveSession.username == username).first()
        if session:
            db.delete(session)
            db.commit()
        return {"message": "Successfully logged out"}
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

@app.get("/restaurants/{restaurant_id}/food_items")
def get_food_items_for_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")


    food_items = db.query(FoodItem).filter(FoodItem.restaurant_id == restaurant_id, FoodItem.is_active == True).all()


    food_items_data = []

    for item in food_items:
        order_count = db.query(func.sum(OrderFoodItem.quantity)).filter(OrderFoodItem.food_item_id == item.id).scalar() or 0
        

        is_popular = order_count > 10

        food_type = item.type.name

        food_items_data.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "image": base64.b64encode(item.image).decode('utf-8') if item.image else None,
            "discount_price": item.discount_price,
            "discount_start": item.discount_start,
            "discount_end": item.discount_end,
            "type": food_type,
            "star": is_popular,
            "restaurant_id_food_item": item.restaurant_id
        })

    return {"restaurant_name": restaurant.name, "food_items": food_items_data}

def send_email(subject: str, body: str, to_email: str):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@app.post("/apply/deliverer")
async def apply_deliverer(deliverer: ApplyDeliverer):
    subject = "New Deliverer Application"
    body = f"New Deliverer Application:\n\nName: {deliverer.name}\nEmail: {deliverer.email}\nPhone: {deliverer.phone}"
    success = send_email(subject, body, "foodie.restaurants@outlook.com")
    return JSONResponse(content={"message": "Application submitted successfully!" if success else "Failed to send email."})

@app.post("/apply/partner")
async def apply_partner(partner: ApplyPartner):
    subject = "New Partner Application"
    body = f"New Partner Application:\n\nRestaurant Name: {partner.name}\nEmail: {partner.email}\nPhone: {partner.phone}"
    success = send_email(subject, body, "foodie.restaurants@outlook.com")
    return JSONResponse(content={"message": "Application submitted successfully!" if success else "Failed to send email."})

#--------------
# Admin
#--------------

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

@app.get("/restaurants/active-restaurnats")
def get_active_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == True).all()

@app.get("/restaurants/archived-restaurnats")
def get_archived_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == False).all()

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


@app.get("/restaurants")
def get_all_restaurants(db: Session = Depends(get_db)):
    return db.query(Restaurant).filter(Restaurant.is_active == True).all()

@app.get("/restaurants/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return db_restaurant


@app.put("/restaurants/{restaurant_id}/restore")
def restore_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    db_restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db_restaurant.is_active = True
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

@app.get("/protected-food_items")
def get_food_items(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):

    restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == current_user['username']).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant admin not found")

    restaurant_id = restaurant_admin.restaurant_id
    food_items = db.query(FoodItem).filter(FoodItem.restaurant_id == restaurant_id).all()

    for item in food_items:
        if item.image:
            item.image = base64.b64encode(item.image).decode('utf-8')

    return jsonable_encoder(food_items)

@app.get("/protected-restaurants")
def get_restaurants(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    username = current_user.get("username")
    restaurant_admin = db.query(models.RestaurantAdmin).filter(models.RestaurantAdmin.username == username).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant admin not found")
    
   
    restaurants = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_admin.restaurant_id).all()
    return restaurants


@app.post("/food_types")
def create_food_type(food_type: FoodTypeCreate, db: Session = Depends(get_db)):
    db_food_type = db.query(FoodType).filter(FoodType.name == food_type.name).first()
    if db_food_type:
        raise HTTPException(status_code=400, detail="Food type already exists")
    new_food_type = FoodType(name=food_type.name)
    db.add(new_food_type)
    db.commit()
    db.refresh(new_food_type)
    return new_food_type

@app.get("/food_types")
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

    food_items_count = db.query(FoodItem).filter(FoodItem.type_id == food_type_id).count()
    if food_items_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete food type. It is referenced by one or more food items.")

    db.delete(db_food_type)
    db.commit()
    return {"detail": "Food type deleted successfully"}

@app.get("/restaurant_types")
def get_restaurant_types(db: Session = Depends(get_db)):
    return db.query(RestaurantType).all()

@app.post("/restaurant_types")
def create_restaurant_type(restaurant_type: RestaurantTypeCreate, db: Session = Depends(get_db)):
    new_restaurant_type = RestaurantType(name=restaurant_type.name)
    db.add(new_restaurant_type)
    db.commit()
    db.refresh(new_restaurant_type)
    return new_restaurant_type

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

    restaurants_count = db.query(Restaurant).filter(Restaurant.id == restaurant_type_id).count()
    if restaurants_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete restaurant type. It is referenced by one or more restaurants.")

    db.delete(db_restaurant_type)
    db.commit()
    return {"detail": "Restaurant type deleted successfully"}

#--------------
# Restaurant Admin
#--------------

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

@app.post("/food_items")
def create_food_item(food_item: FoodItemCreate, db: Session = Depends(get_db)):
    image_data = None
    if food_item.image:
        try:
            image_data = base64.b64decode(food_item.image)
        except base64.binascii.Error:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

    db_food_item = models.FoodItem(
        name=food_item.name,
        description=food_item.description,
        price=food_item.price,
        image=image_data,
        discount_start=food_item.discount_start,
        discount_end=food_item.discount_end,
        discount_price=food_item.discount_price,
        type_id=food_item.type_id,
        restaurant_id=food_item.restaurant_id,
        is_active=food_item.is_active
    )
    db.add(db_food_item)
    db.commit()
    db.refresh(db_food_item)

    response_item = FoodItemCreate(
        id=db_food_item.id,
        name=db_food_item.name,
        description=db_food_item.description,
        price=db_food_item.price,
        discount_start=db_food_item.discount_start,
        discount_end=db_food_item.discount_end,
        discount_price=db_food_item.discount_price,
        type_id=db_food_item.type_id,
        restaurant_id=db_food_item.restaurant_id,
        is_active=db_food_item.is_active
    )

    return response_item

@app.put("/food_items/{food_item_id}")
def update_food_item(food_item_id: int, food_item: FoodItemUpdate, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    update_data = food_item.dict(exclude_unset=True)
    if "image" in update_data and update_data["image"]:
        try:
            update_data["image"] = base64.b64decode(update_data["image"])
        except base64.binascii.Error:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
    
    for key, value in update_data.items():
        setattr(db_food_item, key, value)
    
    db.commit()
    db.refresh(db_food_item)
    
    response_data = db_food_item.__dict__.copy()
    if db_food_item.image:
        response_data["image"] = base64.b64encode(db_food_item.image).decode('utf-8')
    
    return response_data

@app.put("/food_items/{food_item_id}/deactivate")
def deactivate_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    db_food_item.is_active = False

    db.commit()
    db.refresh(db_food_item)

    response_data = db_food_item.__dict__.copy()
    if db_food_item.image:
        response_data["image"] = base64.b64encode(db_food_item.image).decode('utf-8')

    return response_data

@app.put("/food_items/{food_item_id}/activate")
def activate_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    db_food_item.is_active = True

    db.commit()
    db.refresh(db_food_item)

    response_data = db_food_item.__dict__.copy()
    if db_food_item.image:
        response_data["image"] = base64.b64encode(db_food_item.image).decode('utf-8')

    return response_data

@app.delete("/food_items/{food_item_id}")
def delete_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    db.delete(db_food_item)
    db.commit()
    return {"detail": "Food item deleted successfully"}


@app.get("/food_items")
def get_all_food_items(db: Session = Depends(get_db)):
    return db.query(FoodItem).all()

@app.get("/food_items/{id}")
def get_food_item(id: int, db: Session = Depends(get_db)):
    food_item = db.query(FoodItem).filter(FoodItem.id == id).first()
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")

    if food_item.image and isinstance(food_item.image, bytes):
        food_item.image = base64.b64encode(food_item.image).decode('utf-8')

    return food_item


@app.get("/food_items/by_restaurant/{restaurant_id}")
def get_food_items_by_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(FoodItem).filter(FoodItem.restaurant_id == restaurant_id).all()

@app.get("/food_items/by_food_type/{food_type_id}")
def get_food_items_by_food_type(food_type_id: int, db: Session = Depends(get_db)):
    return db.query(FoodItem).filter(FoodItem.food_type_id == food_type_id).all()

@app.put("/food_items/{food_item_id}")
def update_food_item(food_item_id: int, food_item: FoodItemCreate, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    for key, value in food_item.dict().items():
        setattr(db_food_item, key, value)
    
    db.commit()
    db.refresh(db_food_item)
    return db_food_item

@app.delete("/food_items/{food_item_id}")
def delete_food_item(food_item_id: int, db: Session = Depends(get_db)):
    db_food_item = db.query(FoodItem).filter(FoodItem.id == food_item_id).first()
    if not db_food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    db.delete(db_food_item)
    db.commit()
    return {"detail": "Food item deleted successfully"}


@app.get("/active_food_items")
def get_active_food_items(username: str, db: Session = Depends(get_db)):

    admin = db.query(RestaurantAdmin).filter_by(username=username).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    
    restaurant_id = admin.restaurant_id

    restaurant = db.query(Restaurant).filter_by(id=restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    food_items = db.query(FoodItem).filter_by(restaurant_id=restaurant_id, is_active=True).all()

    food_type_items = {}
    for item in food_items:
        if item.image:
            item.image = base64.b64encode(item.image).decode('utf-8')
        food_type = item.type.name
        if food_type not in food_type_items:
            food_type_items[food_type] = []
        food_type_items[food_type].append(item)

    result = {
        "restaurant_name": restaurant.name,
        "food_items": [
            {"food_type": ft, "food_items": jsonable_encoder(items)}
            for ft, items in food_type_items.items()
        ]
    }
    return result


@app.get("/all_restaurants")
def read_restaurants(db: Session = Depends(get_db)):
    restaurants = db.query(Restaurant).options(joinedload(Restaurant.menus), joinedload(Restaurant.orders)).all()
    if not restaurants:
        raise HTTPException(status_code=404, detail="Restaurants not found")
    return restaurants

@app.get("/all_menus")
def read_menus(db: Session = Depends(get_db)):
    menus = db.query(Menu).options(joinedload(Menu.restaurant), joinedload(Menu.food_item)).all()
    if not menus:
        raise HTTPException(status_code=404, detail="Menus not found")
    return menus

@app.get("/all_orders")
def read_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.restaurant),
            joinedload(Order.deliverer),
            joinedload(Order.food_items).joinedload(OrderFoodItem.food_item),
        )
        .all()
    )
    
    if not orders:
        raise HTTPException(status_code=404, detail="Orders not found")
    
    result = []
    for order in orders:
        order_data = {
            "id": order.id,
            "customer": order.customer.username,
            "restaurant": order.restaurant.name,
            "deliverer": order.deliverer.username if order.deliverer else "N/A",
            "total_price": order.total_price,
            "status": order.status,
            "delivery_time": order.delivery_time,
            "delivered_time": order.delivered_time,
            "payment_method": order.payment_method,
            "food_items": [{"name": item.food_item.name, "quantity": item.quantity} for item in order.food_items],
        }
        result.append(order_data)
    
    return result

@app.put("/restaurant_admin/orders/{order_id}/approve")
def approve_order(order_id: int, request: ApproveOrderRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = request.status
    db.commit()
    db.refresh(order)
    deliverer_username = None
    if order.deliverer_id:
        deliverer = db.query(models.Deliverer).filter(models.Deliverer.id == order.deliverer_id).first()
        deliverer_username = deliverer.username
    return OrderResponse(
        id=order.id, 
        status=order.status, 
        total_price=order.total_price,
        deliverer_id=order.deliverer_id,
        deliverer_username=deliverer_username
    )

@app.put("/restaurant_admin/orders/{order_id}/assign")
def assign_order(order_id: int, request: AssignOrderRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    deliverer = db.query(models.Deliverer).filter(models.Deliverer.id == request.deliverer_id).first()
    if not deliverer:
        raise HTTPException(status_code=404, detail="Deliverer not found")
    order.deliverer_id = request.deliverer_id
    order.status = "assigned"
    db.commit()
    db.refresh(order)
    return OrderResponse(
        id=order.id, 
        status=order.status, 
        total_price=order.total_price,
        deliverer_id=order.deliverer_id,
        deliverer_username=deliverer.username
    )

@app.get("/orders/{username}")
def get_orders(username: str, db: Session = Depends(get_db)):
    restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant Admin not found")

    orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_admin.restaurant_id,
        (Order.status == "pending") | (Order.status == "approved")
    ).order_by(Order.delivery_time.desc()).all()

    order_responses = []
    for order in orders:
        deliverer_username = None
        if order.deliverer_id:
            deliverer = db.query(Deliverer).filter(Deliverer.id == order.deliverer_id).first()
            deliverer_username = deliverer.username

        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()

        order_responses.append({
            "id": order.id,
            "status": order.status,
            "total_price": order.total_price,
            "deliverer_id": order.deliverer_id,
            "deliverer_username": deliverer_username,
            "delivery_time": order.delivery_time.strftime("%Y-%m-%d %H:%M:%S") if order.delivery_time else "No delivery time set",
            "restaurant": {
                "name": restaurant.name,
            },
            "customer": {
                "name": f"{customer.first_name} {customer.last_name}",
                "address": customer.address,
                "email": customer.email
            }
        })
    return order_responses


@app.get("/deliverers/free/{username}")
def get_free_deliverers(username: str, db: Session = Depends(get_db)):
    restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant Admin not found")

    free_deliverers = db.query(Deliverer).filter(
        Deliverer.restaurant_id == restaurant_admin.restaurant_id
    ).options(joinedload(Deliverer.orders)).all()

    result = []
    for deliverer in free_deliverers:
        active_session = db.query(ActiveSession).filter(ActiveSession.username == deliverer.username).first()
        if active_session:
            if not deliverer.orders or all(order.status == 'delivered' for order in deliverer.orders):
                result.append(DelivererResponse(id=deliverer.id, username=deliverer.username))

    return result

@app.put("/restaurant_admin/{restaurant_id}/update")
def update_restaurant_by_admin(
    restaurant_id: int,
    restaurant: RestaurantUpdate,
    db: Session = Depends(get_db)
):
    db_restaurant = db.query(models.Restaurant).filter(models.Restaurant.id == restaurant_id).first()
    
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    for key, value in restaurant.dict(exclude_unset=True).items():
        setattr(db_restaurant, key, value)
    
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    
    return db_restaurant

@app.get("/get-id/{username}")
def get_id(username: str, db: Session = Depends(get_db)):
    user = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    return {"id": user.restaurant_id}

@app.get("/restaurant-types")
def get_restaurant_types(db: Session = Depends(get_db)):
    restaurant_types = db.query(models.RestaurantType).all()
    return restaurant_types


#--------------
# Deliverer
#--------------

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


@app.get("/today_orders/{deliverer_id}")
def get_today_orders(deliverer_id: int, db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    orders = (
        db.query(Order)
        .filter(Order.deliverer_id == deliverer_id, Order.created_at >= today)
        .options(
            joinedload(Order.customer),
            joinedload(Order.restaurant),
            joinedload(Order.food_items).joinedload(OrderFoodItem.food_item),
        )
        .order_by(desc(Order.delivered_time))
        .all()
    )
    result = []
    for order in orders:
        food_items = []
        for item in order.food_items:
            item_total_price = item.quantity * item.food_item.price
            food_items.append({
                "name": item.food_item.name,
                "quantity": item.quantity,
                "price": item.food_item.price,
                "total": item_total_price
            })

        order_data = {
            "id": order.id,
            "customer": {
                "name": f"{order.customer.first_name} {order.customer.last_name}",
                "username": order.customer.username,
                "address": order.customer.address
            },
            "restaurant": {
                "name": order.restaurant.name,
                "street": order.restaurant.street,
                "city": order.restaurant.city
            },
            "total_price": order.total_price,
            "quantity": sum(item.quantity for item in order.food_items),
            "status": order.status,
            "payment_method": order.payment_method,
            "delivery_time": order.delivery_time,
            "delivered_time": order.delivered_time,
            "food_items": food_items,
        }
        result.append(order_data)
    return result


@app.get("/get-id-deliverer/{username}")
def get_id(username: str, db: Session = Depends(get_db)):
    user = db.query(Deliverer).filter(Deliverer.username == username).first()
    return {"id": user.id}

@app.put("/orders/{order_id}/status")
def update_order_status(order_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    if status_update.status == "delivered":
        order.delivered_time = datetime.utcnow()
    
    db.commit()
    return {"message": "Order status updated successfully"}

@app.put("/orders/{order_id}/reset")
def reset_order_status(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "assigned"
    order.delivered_time = None
    
    db.commit()
    return {"message": "Order status reset successfully"}

#--------------
# Customer
#--------------


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

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance

@app.get("/restaurants-with-food-items/{username}")
def get_restaurants_with_food_items(username: str, db: Session = Depends(get_db)):

    user = db.query(Customer).filter(Customer.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Korisnik nije pronađen")

    user_latitude = user.latitude
    user_longitude = user.longitude

    restaurants = db.query(Restaurant).filter(Restaurant.is_active == True).all()
    result = []
    
    for restaurant in restaurants:
        distance = calculate_distance(user_latitude, user_longitude, restaurant.latitude, restaurant.longitude)
        if distance <= restaurant.distance_limit:
            food_items = db.query(FoodItem).filter(FoodItem.restaurant_id == restaurant.id, FoodItem.is_active == True).all()
            restaurant_data = {
                "restaurant_name": restaurant.name,
                "restaurant_id": restaurant.id,
                "food_items": []
            }
            
            for item in food_items:

                order_count = db.query(func.sum(OrderFoodItem.quantity)).filter(OrderFoodItem.food_item_id == item.id).scalar() or 0
                
                is_popular = order_count > 10

                food_type = db.query(FoodType).filter(FoodType.id == item.type_id).first().name

                restaurant_data["food_items"].append({
                    "id": item.id,
                    "name": item.name,
                    "description": item.description,
                    "price": item.price,
                    "image": base64.b64encode(item.image).decode('utf-8') if item.image else None,
                    "discount_price": item.discount_price,
                    "discount_start": item.discount_start,
                    "discount_end": item.discount_end,
                    "type": food_type,
                    "star": is_popular,
                    "restaurant_id_food_item": item.restaurant_id
                })
            
            result.append(restaurant_data)
    
    return result


def send_order_confirmation_email(email: str, order_ids: list, db: Session):

    orders = db.query(Order).filter(Order.id.in_(order_ids)).all()
    
    if not orders:
        print("No orders found")
        return
    
    email_subject = "Order Confirmation"
    email_body = "Thank you for your order!\n\nHere are the details of your order:\n\n"
    
    for order in orders:
        order_items = db.query(OrderFoodItem).filter(OrderFoodItem.order_id == order.id).all()
        
        for order_item in order_items:
            food_item = db.query(FoodItem).filter(FoodItem.id == order_item.food_item_id).first()
            if food_item:
                item_name = food_item.name
                item_price = food_item.price
                total_item_price = item_price * order_item.quantity
                email_body += f"Item: {item_name}\nQuantity: {order_item.quantity}\nPrice: ${total_item_price:.2f}\n\n"
    
    email_body += f"Total Price: ${sum(order.total_price for order in orders):.2f}\n\n"
    email_body += f"Delivery Time: {orders[0].delivery_time if orders[0].delivery_time else 'Not specified'}\n\n"
    email_body += "We will notify you when your order is out for delivery.\n\nThank you for choosing us!"
    
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = email
    msg['Subject'] = email_subject
    msg.attach(MIMEText(email_body, 'plain'))
    
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        server.sendmail(SMTP_USER, email, msg.as_string())
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")
    finally:
        server.quit()


@app.post("/customer/create-order/{username}")
def create_order(username: str, order: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.username == username).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    delivery_time = datetime.now() if not order.delivery_time else datetime.fromisoformat(order.delivery_time)
    
    total_price = 0
    restaurant_id = None
    
    for item in order.cart:
        food_item = db.query(FoodItem).filter(FoodItem.id == item.food_item_id).first()
        if not food_item:
            raise HTTPException(status_code=404, detail=f"Food item with ID {item.food_item_id} not found")
        
        item_total_price = food_item.price * item.quantity
        total_price += item_total_price
        
        if restaurant_id is None:
            restaurant_id = food_item.restaurant_id
        elif restaurant_id != food_item.restaurant_id:
            raise HTTPException(status_code=400, detail="All items in the cart must be from the same restaurant")

    order_instance = Order(
        customer_id=customer.id,
        restaurant_id=restaurant_id,
        delivery_time=delivery_time,
        total_price=total_price,
        payment_method=order.payment_method
    )
    db.add(order_instance)
    db.commit()
    db.refresh(order_instance)
    
    for item in order.cart:
        order_food_item = OrderFoodItem(
            order_id=order_instance.id,
            food_item_id=item.food_item_id,
            quantity=item.quantity
        )
        db.add(order_food_item)
    
    db.commit()
    

    send_order_confirmation_email(customer.email, [order_instance.id], db)

    new_notification = Notification(
        restaurant_id=restaurant_id,
        order_id=order_instance.id,
    )
    db.add(new_notification)
    db.commit()
    
    return {"detail": "Order placed successfully", "order_id": order_instance.id}

@app.get("/customer/orders/{username}")
def get_orders_for_customer(username: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.username == username).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
    
    orders_details = []
    for order in orders:
        restaurant = db.query(Restaurant).filter(Restaurant.id == order.restaurant_id).first()
        order_food_items = db.query(OrderFoodItem).filter(OrderFoodItem.order_id == order.id).all()

        food_items_details = []
        for order_food_item in order_food_items:
            food_item = db.query(FoodItem).filter(FoodItem.id == order_food_item.food_item_id).first()
            food_items_details.append({
                "name": food_item.name,
                "quantity": order_food_item.quantity,
                "price": food_item.price
            })

        order_details = {
            "id": order.id,
            "created_at": order.created_at,
            "delivery_time": order.delivery_time,
            "delivered_time": order.delivered_time,
            "status": order.status,
            "total_price": order.total_price,
            "payment_method": order.payment_method,
            "restaurant_name": restaurant.name if restaurant else "Unknown",
            "food_items": food_items_details
        }
        orders_details.append(order_details)

    return orders_details

# Extra features

@app.get("/notifications/{username}")
async def get_notifications(username: str, db: Session = Depends(get_db)):
    restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant admin not found")
    
    notifications = db.query(Notification).filter(
        Notification.restaurant_id == restaurant_admin.restaurant_id
    ).order_by(Notification.created_at.desc()).all()

    # Izbroji nepročitane notifikacije
    unread_count = db.query(Notification).filter(
        Notification.restaurant_id == restaurant_admin.restaurant_id,
        Notification.is_read == False
    ).count()

    return {"notifications": notifications, "unread_count": unread_count}

@app.put("/notifications/mark_as_read/{username}")
async def mark_notifications_as_read(username: str, db: Session = Depends(get_db)):
    restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    if not restaurant_admin:
        raise HTTPException(status_code=404, detail="Restaurant admin not found")
    
    db.query(Notification).filter(
        Notification.restaurant_id == restaurant_admin.restaurant_id,
        Notification.is_read == False
    ).update({"is_read": True})

    db.commit()
    return {"message": "Notifications marked as read"}



@app.get("/deliverers/{username}")
def get_deliverers_by_admin(username: str, db: Session = Depends(get_db)):
    try:
        admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Restaurant admin not found")

        deliverers = db.query(Deliverer).filter(Deliverer.restaurant_id == admin.restaurant_id).all()
        return deliverers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching deliverers: {str(e)}")

@app.get("/map/orders/{username}")
def get_orders_by_date(
    username: str,
    selected_date: date, 
    deliverer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        restaurant_admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
        if not restaurant_admin:
            raise HTTPException(status_code=404, detail="RestaurantAdmin not found")

        restaurant_id = restaurant_admin.restaurant_id
        
        query = db.query(Order).join(Customer).filter(
            func.date(Order.delivery_time) == selected_date,
            Order.restaurant_id == restaurant_id
        )
        
        if deliverer_id:
            query = query.filter(Order.deliverer_id == int(deliverer_id))
        
        orders = query.all()
        
        return [
            {
                "id": order.id,
                "customer_id": order.customer_id,
                "restaurant_id": order.restaurant_id,
                "deliverer_id": order.deliverer_id,
                "created_at": order.created_at.date(),
                "delivery_time": order.delivery_time.date(),
                "status": order.status,
                "total_price": order.total_price,
                "customer_latitude": order.customer.latitude,
                "customer_longitude": order.customer.longitude,
            } for order in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Restaurant Admins reports

def generate_restaurant_report(restaurant_id: int, db: Session):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    restaurant_name = restaurant.name if restaurant else "Unknown Restaurant"
    pdf.setTitle(f"Report for {restaurant_name}")

    start_of_month = datetime.now().replace(day=1)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)

    orders = db.query(Order).filter(Order.restaurant_id == restaurant_id,
                                    Order.created_at >= start_of_month,
                                    Order.created_at <= end_of_month).all()

    daily_order_counts = {}
    for order in orders:
        order_day = order.created_at.strftime("%Y-%m-%d")
        daily_order_counts[order_day] = daily_order_counts.get(order_day, 0) + 1

    pdf.drawString(100, 750, f"Daily Orders Report for {start_of_month.strftime('%B %Y')}")
    y = 730
    for day, count in daily_order_counts.items():
        pdf.drawString(100, y, f"{day}: {count} orders")
        y -= 20

    pdf.drawString(100, y - 20, f"Total orders for the month: {len(orders)}")

    y -= 60
    pdf.drawString(100, y, "Deliverer Performance:")
    y -= 20
    
    deliverer_performance = {}
    deliverers = db.query(Deliverer).filter(Deliverer.id.in_([order.deliverer_id for order in orders if order.deliverer_id])).all()
    deliverer_usernames = {deliverer.id: deliverer.username for deliverer in deliverers}

    for order in orders:
        if order.deliverer_id:
            deliverer_performance[order.deliverer_id] = deliverer_performance.get(order.deliverer_id, 0) + 1

    for deliverer_id, count in deliverer_performance.items():
        username = deliverer_usernames.get(deliverer_id, "Unknown Deliverer")
        pdf.drawString(100, y, f"Deliverer {username}: {count} deliveries")
        y -= 20

    pdf.save()
    buffer.seek(0)
    return buffer

def send_email(to_email, subject, body, attachment_io):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    part = MIMEApplication(attachment_io.read(), Name='report.pdf')
    part['Content-Disposition'] = f'attachment; filename="report.pdf"'
    msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
    except smtplib.SMTPRecipientsRefused as e:
        print(f"Failed to send email to {to_email}: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


def send_monthly_reports():
    db: Session = Depends(get_db)
    restaurants = db.query(Restaurant).all()
    
    for restaurant in restaurants:
        restaurant_admins = db.query(RestaurantAdmin).filter(RestaurantAdmin.restaurant_id == restaurant.id).all()
        pdf_report = generate_restaurant_report(restaurant.id, db)
        
        for admin in restaurant_admins:
            pdf_report.seek(0)
            send_email(admin.email, f"Monthly Report for {restaurant.name}", "Attached is your monthly report from Foodie.", pdf_report)
    
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(send_monthly_reports, 'cron', day=1, hour=8, minute=0)
scheduler.start()

@app.post("/send-test-report")
def send_test_report(db: Session = Depends(get_db)):
    restaurant_id = 1
    restaurant_admins = db.query(RestaurantAdmin).filter(RestaurantAdmin.restaurant_id == restaurant_id).all()
    
    pdf_report = generate_restaurant_report(restaurant_id, db)
    
    for admin in restaurant_admins:
        pdf_report.seek(0)
        send_email(admin.email, f"Test Report for Restaurant ID {restaurant_id}", "This is a test report from Foodie.", pdf_report)
    
    return {"message": "Test report sent successfully"}

# Admin reports

def generate_admin_report(db: Session):
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    
    pdf.setTitle("Admin Report")

    restaurants = db.query(Restaurant).all()

    pdf.drawString(100, 750, "Restaurant Performance Report")
    y = 730

    for restaurant in restaurants:
        restaurant_name = restaurant.name
        pdf.drawString(100, y, f"Restaurant: {restaurant_name}")
        y -= 20

        orders = db.query(Order).filter(Order.restaurant_id == restaurant.id).all()
        total_orders = len(orders)
        total_profit = sum(order.total_price for order in orders)

        pdf.drawString(100, y, f"Total Orders: {total_orders}")
        y -= 20
        pdf.drawString(100, y, f"Total Profit: ${total_profit:.2f}")
        y -= 40

    pdf.save()
    buffer.seek(0)
    return buffer

def send_admin_reports():
    db: Session = Depends(get_db)
    admins = db.query(Admin).all()
    
    pdf_report = generate_admin_report(db)

    for admin in admins:
        pdf_report.seek(0)
        send_email(admin.email, "Monthly Report for Admins", "Attached is the monthly report from Foodie.", pdf_report)
    
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(send_admin_reports, 'cron', day=1, hour=8, minute=0)
scheduler.start()

@app.post("/send-test-admin-report")
def send_test_admin_report(db: Session = Depends(get_db)):
    pdf_report = generate_admin_report(db)
    
    admins = db.query(Admin).all()
    for admin in admins:
        pdf_report.seek(0)
        send_email(admin.email, "Test Admin Report", "This is a test report from Foodie.", pdf_report)
    
    return {"message": "Test report sent successfully"}

# Forgot password

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_EXPIRATION_SECONDS = os.getenv("JWT_EXPIRATION_SECONDS")

def generate_reset_token(username: str, email: str, role: str) -> str:
    payload = {
        "username": username,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION_SECONDS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")

def send_reset_email(to_email: str, reset_token: str, username: str):
    subject = "Password Reset Request"
    body = f"Hi {username},\n\nYour password reset token is: {reset_token}\n\nIf you did not request a password reset, please ignore this email.\n\nBest regards,\nFoodie Restaurants Team"

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            print(f"Reset token email sent to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

def find_user_by_role(db: Session, username: str, email: str, role: str):
    if role == "admin":
        return db.query(models.Admin).filter(models.Admin.username == username, models.Admin.email == email).first()
    elif role == "restaurantadmin":
        return db.query(models.RestaurantAdmin).filter(models.RestaurantAdmin.username == username, models.RestaurantAdmin.email == email).first()
    elif role == "deliverer":
        return db.query(models.Deliverer).filter(models.Deliverer.username == username, models.Deliverer.email == email).first()
    elif role == "customer":
        return db.query(models.Customer).filter(models.Customer.username == username, models.Customer.email == email).first()
    return None

@app.post("/request-password-reset")
async def request_password_reset(data: RequestPasswordResetSchema, db: Session = Depends(get_db)):
    user = find_user_by_role(db, data.username, data.email, data.role)
    if not user:
        raise HTTPException(status_code=404, detail="User with this username, email, and role not found")

    reset_token = generate_reset_token(data.username, data.email, data.role)
    send_reset_email(data.email, reset_token, data.username)

    return {"message": "Reset token sent to your email"}

@app.post("/verify-reset-token")
async def verify_reset_token(token: str = Query(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return {"message": "Reset token verified", "username": payload["username"], "email": payload["email"], "role": payload["role"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid reset token")

@app.post("/reset-password")
async def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(data.token, JWT_SECRET_KEY, algorithms=["HS256"])
        user = find_user_by_role(db, data.username, data.email, data.role)
        if not user:
            raise HTTPException(status_code=404, detail=f"User not found with username: {data.username}, email: {data.email}, role: {data.role}")

        hashed_password = get_password_hash(data.new_password)
        user.password = hashed_password
        db.commit()

        return {"message": "Password reset successful"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/rateable/{username}")
def get_rateable_order(username: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter_by(username=username).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    order = db.query(Order).filter(
        Order.customer_id == customer.id,
        Order.status == 'delivered'
    ).order_by(Order.delivered_time.desc()).first()

    if not order:
        raise HTTPException(status_code=404, detail="No delivered orders found.")

    if not order.delivered_time:
        raise HTTPException(status_code=404, detail="Order has not been delivered yet.")

    delivery_deadline = order.delivered_time + timedelta(hours=48)
    if datetime.utcnow() > delivery_deadline:
        raise HTTPException(status_code=400, detail="Rating period expired.")

    return order

@app.post("/orders/rating/{username}")
def rate_order(username: str, rating: RatingCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter_by(username=username).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    order = db.query(Order).filter(
        Order.customer_id == customer.id,
        Order.status == 'delivered'
    ).order_by(Order.delivered_time.desc()).first()

    if not order:
        raise HTTPException(status_code=404, detail="No rateable orders found or order not delivered.")

    existing_rating = db.query(Rating).filter_by(customer_id=customer.id, order_id=order.id).first()
    if existing_rating:
        raise HTTPException(status_code=400, detail="Last delivered order already rated.")

    delivery_deadline = order.delivered_time + timedelta(hours=48)
    if datetime.utcnow() > delivery_deadline:
        raise HTTPException(status_code=400, detail="Rating period expired.")

    new_rating = Rating(
        customer_id=customer.id,
        restaurant_id=order.restaurant_id,
        order_id=order.id,
        rating=rating.rating,
        comment=rating.comment,
        created_at=datetime.utcnow()
    )

    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)

    return new_rating

@app.get("/ratings/{username}")
def get_ratings_for_admin(username: str, db: Session = Depends(get_db)):
    admin = db.query(RestaurantAdmin).filter(RestaurantAdmin.username == username).first()
    
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    ratings = (db.query(Rating)
                  .join(Customer, Rating.customer_id == Customer.id)
                  .join(Restaurant, Rating.restaurant_id == Restaurant.id)
                  .join(Order, Rating.order_id == Order.id)
                  .filter(Rating.restaurant_id == admin.restaurant_id)
                  .order_by(Rating.created_at.desc())
                  .all())
    
    if not ratings:
        raise HTTPException(status_code=404, detail="No ratings found for this restaurant")
    
    return [
        {
            "id": rating.id,
            "rating": rating.rating,
            "comment": rating.comment,
            "created_at": rating.created_at.isoformat(),
            "customer": {
                "username": rating.customer.username,
                "email": rating.customer.email
            },
            "restaurant": {
                "name": rating.restaurant.name,
                "street": rating.restaurant.street
            },
            "order": {
                "id": rating.order.id
            }
        }
        for rating in ratings
    ]