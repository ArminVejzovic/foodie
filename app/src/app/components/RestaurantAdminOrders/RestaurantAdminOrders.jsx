"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RestaurantAdminOrders.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

const RestaurantAdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [freeDeliverers, setFreeDeliverers] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "Orders - Restaurant Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
      } else {
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchOrdersAndDeliverers = async () => {
      const ordersData = await fetchOrders();
      const freeDeliverersData = await fetchFreeDeliverers();
      setOrders(ordersData);
      setFreeDeliverers(freeDeliverersData);
    };

    fetchOrdersAndDeliverers();

    const intervalId = setInterval(() => {
      fetchOrdersAndDeliverers();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchOrders = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      return [];
    }
    
    const response = await axios.get(`http://localhost:8000/orders/${username}`);
    return response.data;
  };
  
  const fetchFreeDeliverers = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      return [];
    }
    
    const response = await axios.get(`http://localhost:8000/deliverers/free/${username}`);
    return response.data;
  };

  const approveOrder = async (orderId, status) => {
    const response = await axios.put(`http://localhost:8000/restaurant_admin/orders/${orderId}/approve`, { status });
    return response.data;
  };

  const assignOrder = async (orderId, delivererId) => {
    const response = await axios.put(`http://localhost:8000/restaurant_admin/orders/${orderId}/assign`, { deliverer_id: delivererId });
    return response.data;
  };

  const handleApproveOrder = async (orderId) => {
    const updatedOrder = await approveOrder(orderId, 'approved');
    setOrders(orders.map(order => (order.id === orderId ? updatedOrder : order)));
  };

  const handleAssignOrder = async (orderId, delivererId) => {
    const updatedOrder = await assignOrder(orderId, delivererId);
    setOrders(orders.map(order => (order.id === orderId ? updatedOrder : order)));
    setFreeDeliverers(freeDeliverers.filter(deliverer => deliverer.id !== delivererId));
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>Orders</h1>
      <ul className={styles.orderList}>
        {orders.map(order => (
          <li key={order.id} className={styles.orderItem}>
            <div className={styles.orderInfo}>
              <span><strong>Order ID:</strong> {order.id}</span><br />
              <span><strong>Status:</strong> {order.status}</span><br />
              <span><strong>Total Price:</strong> {order.total_price}$</span><br />
              <span><strong>Delivery Time:</strong> {order.delivery_time}</span><br />
              <span><strong>Deliverer:</strong> {order.deliverer_username || 'Not assigned'}</span><br />
              <span><strong>Restaurant:</strong> {order.restaurant ? order.restaurant.name : 'Unknown'}</span><br />
              <span><strong>Customer:</strong> {order.customer ? order.customer.name : 'Unknown'}</span><br />
              <span><strong>Customer Address:</strong> {order.customer ? order.customer.address : 'Unknown'}</span><br />
              <span><strong>Customer Email:</strong> {order.customer ? order.customer.email : 'Unknown'}</span><br />
            </div>
            <div className={styles.orderActions}>
              {order.status === 'pending' && (
                <button className={styles.approveButton} onClick={() => handleApproveOrder(order.id)}>Approve</button>
              )}
              {order.status === 'approved' && (
                <select className={styles.selectDeliverer} onChange={(e) => handleAssignOrder(order.id, e.target.value)}>
                  <option value="">Select Deliverer</option>
                  {freeDeliverers.map(deliverer => (
                    <option key={deliverer.id} value={deliverer.id}>{deliverer.username}</option>
                  ))}
                </select>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantAdminOrders;
