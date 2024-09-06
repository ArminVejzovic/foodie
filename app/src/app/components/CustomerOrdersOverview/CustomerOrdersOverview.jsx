"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CustomerOrdersOverview.module.css';
import { useRouter } from 'next/navigation';	
import { FaArrowLeft } from 'react-icons/fa'; 

const CustomerOrdersOverview = ({ username }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "Orders History - Customer";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);
    const checkAuth = () => {
        const role = localStorage.getItem('role');
        if (role === 'customer') {
            setIsAuthorized(true);
        } else {
            router.push('/notauthenticated');
        }
    };
    checkAuth();
}, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const username = localStorage.getItem('username');
        const response = await axios.get(`http://localhost:8000/customer/orders/${username}`);
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [username]);

  if (loading) {
    return <p>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p>No orders found.</p>;
  }

  const handleGoBack = () => {
    router.back();
  };

  if(!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.ordersContainer}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h1 style={{ textAlign: 'center' }}>Orders History</h1>
      {orders.map((order) => (
        <div key={order.id} className={styles.orderCard}>
          <h3>Order #{order.id}</h3>
          <p><strong>Restaurant:</strong> {order.restaurant_name}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Ordered At:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Delivery Time:</strong> {new Date(order.delivery_time).toLocaleString()}</p>
          <p><strong>Payment Method:</strong> {order.payment_method}</p>
          <div className={styles.foodItems}>
            <h4>Items Ordered:</h4>
            <ul>
              {order.food_items.map((item, index) => (
                <li key={index}>
                  {item.quantity} x {item.name} (${item.price.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
          <p><strong>Total Price:</strong> ${order.total_price.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
};

export default CustomerOrdersOverview;
