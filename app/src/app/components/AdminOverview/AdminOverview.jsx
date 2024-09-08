"use client"
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './AdminOverview.module.css';
import { FaArrowLeft } from 'react-icons/fa'; 

const AdminOverview = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Admin Overview - Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      if (role === 'admin') {
        setIsAuthorized(true);
      } else {
        router.push('/notauthenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchData = () => {
    axios.get('http://localhost:8000/all_restaurants')
      .then(response => setRestaurants(response.data))
      .catch(error => console.error("There was an error fetching the restaurants!", error));

    axios.get('http://localhost:8000/all_menus')
      .then(response => setMenus(response.data))
      .catch(error => console.error("There was an error fetching the menus!", error));

    axios.get('http://localhost:8000/all_orders')
      .then(response => setOrders(response.data))
      .catch(error => console.error("There was an error fetching the orders!", error));
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.adminOverview}>
      <button onClick={handleGoBack} className={styles.backButton}>
        <FaArrowLeft size={20}/>
      </button>

      <section>
        <h1 className={styles.heading}>Restaurants</h1>
        <div className={styles['table-container']}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
                <th>Street</th>
                <th>Stars</th>
                <th>Category</th>
                <th>Distance Limit</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map(restaurant => (
                <tr key={restaurant.id}>
                  <td>{restaurant.name}</td>
                  <td>{restaurant.city}</td>
                  <td>{restaurant.street}</td>
                  <td>{restaurant.stars}</td>
                  <td>{restaurant.category}</td>
                  <td>{restaurant.distance_limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h1 className={styles.heading}>Menus</h1>
        <div className={styles['table-container']}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Food Item</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {menus.map(menu => (
                <tr key={menu.id}>
                  <td>{menu.restaurant.name}</td>
                  <td>{menu.food_item.name}</td>
                  <td>{menu.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
      <h1 className={styles.heading}>Orders</h1>
        <div className={styles['table-container']}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Deliverer</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Delivery Time</th>
                <th>Delivered Time</th>
                <th>Payment Method</th>
                <th>Food Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td data-label="Customer">{order.customer}</td>
                  <td data-label="Restaurant">{order.restaurant}</td>
                  <td data-label="Deliverer">{order.deliverer}</td>
                  <td data-label="Total Price">{order.total_price}</td>
                  <td data-label="Status">{order.status}</td>
                  <td data-label="Delivery Time">
                    {order.delivery_time ? new Date(new Date(order.delivery_time).setHours(new Date(order.delivery_time).getHours() + 2)).toLocaleString() : 'N/A'}
                  </td>
                  <td data-label="Delivered Time">
                    {order.delivered_time ? new Date(new Date(order.delivered_time).setHours(new Date(order.delivered_time).getHours() + 2)).toLocaleString() : 'N/A'}
                  </td>
                  <td data-label="Payment Method">{order.payment_method}</td>
                  <td>
                    {order.food_items.map((item, index) => (
                      <div key={index}>
                        {item.name} - {item.quantity}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminOverview;
