import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RestaurantAdminNotifications.module.css';
import { FaBell } from 'react-icons/fa';

const RestaurantAdminNotifications = ({ username }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const username = localStorage.getItem('username');
        const response = await axios.get(`http://localhost:8000/notifications/${username}`);
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, [username]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.notificationWrapper}>
      <div className={styles.bellIcon} onClick={toggleNotifications}>
        <FaBell />
      </div>
      {isOpen && (
        <div className={styles.notificationBar}>
          {notifications.length ? (
            notifications.map((notification) => (
              <div key={notification.id} className={styles.notificationItem}>
                Order #{notification.order_id} received at {new Date(notification.created_at).toLocaleString()}
              </div>
            ))
          ) : (
            <div className={styles.noNotifications}>No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantAdminNotifications;
