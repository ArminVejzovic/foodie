from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
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
    #ratings = relationship("Rating", back_populates="restaurant")
    #notifications = relationship("Notification", back_populates="restaurant")

class Admin(Base):
    __tablename__ = 'admins'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="admin")

    #chat_messages = relationship("ChatMessage", back_populates="receiver")


class RestaurantAdmin(Base):
    __tablename__ = 'restaurant_admins'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="restaurantadmin")
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    
    #notifications = relationship("Notification", back_populates="restaurant_admin")
    #chat_messages = relationship("ChatMessage", back_populates="restaurant_admin")
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
    #chat_messages = relationship("ChatMessage", back_populates="sender")
    #ratings = relationship("Rating", back_populates="customer")
    #notifications = relationship("Notification", back_populates="customer")

class Menu(Base):
    __tablename__ = 'menus'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)
    discount_start = Column(DateTime, nullable=True)
    discount_end = Column(DateTime, nullable=True)
    discount_price = Column(Float, nullable=True)
    is_group = Column(Boolean, default=False)

    restaurant = relationship("Restaurant", back_populates="menus")


class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    deliverer_id = Column(Integer, ForeignKey('deliverers.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    delivery_time = Column(DateTime, nullable=True)
    status = Column(String, default="pending")
    total_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    payment_method = Column(String, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")
    deliverer = relationship("Deliverer", back_populates="orders")


class FoodType(Base):
    __tablename__ = 'food_types'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

class RestaurantType(Base):
    __tablename__ = 'restaurant_types'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)

## Dodatni zahtjevi ##
"""
class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey('customers.id'))
    receiver_id = Column(Integer, ForeignKey('admins.id'))
    restaurant_admin_id = Column(Integer, ForeignKey('restaurant_admins.id'))
    deliverer_id = Column(Integer, ForeignKey('deliverers.id'))
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("Customer", back_populates="chat_messages")
    receiver = relationship("Admin", back_populates="chat_messages")
    restaurant_admin = relationship("RestaurantAdmin", back_populates="chat_messages")
    deliverer = relationship("Deliverer", back_populates="chat_messages")


class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    restaurant_admin_id = Column(Integer, ForeignKey('restaurant_admins.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    customer_id = Column(Integer, ForeignKey('customers.id'))
    deliverer_id = Column(Integer, ForeignKey('deliverers.id'))
    message = Column(Text, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    restaurant_admin = relationship("RestaurantAdmin", back_populates="notifications")
    restaurant = relationship("Restaurant", back_populates="notifications")
    customer = relationship("Customer", back_populates="notifications")
    deliverer = relationship("Deliverer", back_populates="notifications")


class Rating(Base):
    __tablename__ = 'ratings'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey('customers.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="ratings")
    restaurant = relationship("Restaurant", back_populates="ratings")

"""