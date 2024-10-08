from sqlalchemy import Column, Integer, LargeBinary, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Restaurant(Base):
    __tablename__ = 'restaurants'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    stars = Column(Integer, nullable=False)
    category = Column(String, nullable=False)
    distance_limit = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    menus = relationship("Menu", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")
    deliverers = relationship("Deliverer", back_populates="restaurant")
    restaurant_admins = relationship("RestaurantAdmin", back_populates="restaurant")
    food_items = relationship("FoodItem", back_populates="restaurant")
    ratings = relationship("Rating", back_populates="restaurant")
    notifications = relationship("Notification", back_populates="restaurant")

class Admin(Base):
    __tablename__ = 'admins'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="admin")



class RestaurantAdmin(Base):
    __tablename__ = 'restaurant_admins'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="restaurantadmin")
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))

    restaurant = relationship("Restaurant", back_populates="restaurant_admins")

class Deliverer(Base):
    __tablename__ = 'deliverers'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="deliverer")
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'), nullable=True)

    restaurant = relationship("Restaurant", back_populates="deliverers")
    orders = relationship("Order", back_populates="deliverer")

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    role = Column(String, default="customer")

    orders = relationship("Order", back_populates="customer")
    ratings = relationship("Rating", back_populates="customer")

class Menu(Base):
    __tablename__ = 'menus'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    food_item_id = Column(Integer, ForeignKey('food_items.id'))
    is_active = Column(Boolean, default=True)

    restaurant = relationship("Restaurant", back_populates="menus")
    food_item = relationship("FoodItem", back_populates="menus")


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    deliverer_id = Column(Integer, ForeignKey('deliverers.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    delivered_time = Column(DateTime, nullable=True)  # Time when deliverer delivered order
    delivery_time = Column(DateTime, nullable=True)  # Time when customer wants to deliver order
    status = Column(String, default="pending")
    total_price = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    deliverer = relationship("Deliverer", back_populates="orders")

    food_items = relationship("OrderFoodItem", back_populates="order")
    notifications = relationship("Notification", back_populates="order")
    ratings = relationship("Rating", back_populates="order")

class OrderFoodItem(Base):
    __tablename__ = 'order_fooditem'
    order_id = Column(Integer, ForeignKey('orders.id'), primary_key=True)
    food_item_id = Column(Integer, ForeignKey('food_items.id'), primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

    order = relationship("Order", back_populates="food_items")
    food_item = relationship("FoodItem", back_populates="orders")


class FoodType(Base):
    __tablename__ = 'food_types'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class RestaurantType(Base):
    __tablename__ = 'restaurant_types'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class FoodItem(Base):
    __tablename__ = 'food_items'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    image = Column(LargeBinary, nullable=True)
    discount_start = Column(DateTime, nullable=True)
    discount_end = Column(DateTime, nullable=True)
    discount_price = Column(Float, nullable=True)
    type_id = Column(Integer, ForeignKey('food_types.id'), nullable=False)
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'), nullable=False)
    is_active = Column(Boolean, default=True)

    type = relationship("FoodType")
    restaurant = relationship("Restaurant")
    menus = relationship("Menu", back_populates="food_item")
    
    orders = relationship("OrderFoodItem", back_populates="food_item")

class MenuFoodItem(Base):
    __tablename__ = 'menu_fooditem'
    menu_id = Column(Integer, ForeignKey('menus.id'), primary_key=True)
    fooditem_id = Column(Integer, ForeignKey('food_items.id'), primary_key=True)

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'), nullable=False)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Restaurant", back_populates="notifications")
    order = relationship("Order", back_populates="notifications")

class Rating(Base):
    __tablename__ = 'ratings'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    order_id = Column(Integer, ForeignKey('orders.id'))
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="ratings")
    restaurant = relationship("Restaurant", back_populates="ratings")
    order = relationship("Order", back_populates="ratings")

class ActiveSession(Base):
    __tablename__ = 'active_sessions'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)