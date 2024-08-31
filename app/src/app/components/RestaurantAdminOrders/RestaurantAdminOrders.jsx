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
      console.log('Role in component:', role);
      
      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
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
    }, 5000); // Fetch data every 5 seconds

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, []);

  const fetchOrders = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      return;
    }
    
    const response = await axios.get(`http://localhost:8000/orders/${username}`);
    return response.data;
  };
  
  const fetchFreeDeliverers = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('Username not found in local storage');
      return;
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
              <span>Order ID: {order.id} </span><br></br>
              <span>Status: {order.status} </span><br></br>
              <span>Total Price: {order.total_price}$ </span><br></br>
              <span>Delivery Time: {new Date(order.delivery_time).toLocaleString()} </span><br></br>
              <span>Deliverer: {order.deliverer_username || 'Not assigned'}</span><br></br>
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
