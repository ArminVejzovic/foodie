"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './DelivererOrders.module.css';
import { FaArrowLeft } from 'react-icons/fa';

const DelivererOrders = () => {
  const [orders, setOrders] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Orders - Deliverer";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      if (role === 'deliverer') {
        setIsAuthorized(true);
        const fetchDelivererId = async () => {
          const username = localStorage.getItem('username');
          const response = await axios.get(`http://localhost:8000/get-id-deliverer/${username}`);
          const delivererId = response.data.id;
          fetchOrders(delivererId);
        };
        fetchDelivererId();
      } else {
        router.push('/notauthenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchOrders = (delivererId) => {
    axios.get(`http://localhost:8000/today_orders/${delivererId}`)
      .then(response => setOrders(response.data))
      .catch(error => console.error("There was an error fetching the orders!", error));
  };

  const handleStatusChange = (orderId, newStatus) => {
    axios.put(`http://localhost:8000/orders/${orderId}/status`, { status: newStatus })
      .then(() => {
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, delivered_time: new Date().toISOString() } : order
        );
        setOrders(updatedOrders);
      })
      .catch(error => console.error("There was an error updating the order status!", error));
  };

  const handleResetStatus = (orderId) => {
    axios.put(`http://localhost:8000/orders/${orderId}/reset`)
      .then(() => {
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, status: "assigned", delivered_time: null } : order
        );
        setOrders(updatedOrders);
      })
      .catch(error => console.error("There was an error resetting the order status!", error));
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h1 className={styles.heading}>Today's Orders</h1>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Delivery Time</th>
              <th>Delivered Time</th>
              <th>Food Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.customer_name}</td>
                <td>{order.restaurant_name}</td>
                <td>{order.total_price}</td>
                <td>{order.status}</td>
                <td>{order.payment_method}</td>
                <td>{order.delivery_time ? new Date(order.delivery_time).toLocaleString() : "Not Set"}</td>
                <td>{order.delivered_time ? new Date(order.delivered_time).toLocaleString() : "Not Delivered"}</td>
                <td>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {order.food_items.map((item, index) => (
                      <li key={index}>
                        {item.name} x {item.quantity}  {item.price} x {item.quantity} = {(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  {order.status === "delivered" ? (
                    <button className={styles.button} onClick={() => handleResetStatus(order.id)}>Mark as Not Delivered</button>
                  ) : order.status === "assigned" ? (
                    <button className={styles.button} onClick={() => handleStatusChange(order.id, "delivered")}>Mark as Delivered</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DelivererOrders;
