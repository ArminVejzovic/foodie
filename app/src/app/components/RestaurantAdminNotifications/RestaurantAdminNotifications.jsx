import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RestaurantAdminNotifications.module.css';
import { FaBell } from 'react-icons/fa';

const RestaurantAdminNotifications = ({ username }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifikacija sa intervalom svakih 5 sekundi
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const username = localStorage.getItem('username');
        const response = await axios.get(`http://localhost:8000/notifications/${username}`);
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unread_count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications(); // Fetch odmah na mount

    // Interval koji provjerava notifikacije svakih 5 sekundi
    const intervalId = setInterval(fetchNotifications, 5000);

    // Očisti interval kada se komponenta demontira
    return () => clearInterval(intervalId);
  }, [username]);

  const toggleNotifications = async () => {
    setIsOpen(!isOpen);

    // Kada korisnik zatvori notifikacije, tada oznaci sve kao pročitane
    if (isOpen && unreadCount > 0) {
      try {
        const username = localStorage.getItem('username');
        await axios.put(`http://localhost:8000/notifications/mark_as_read/${username}`);
        setUnreadCount(0); // Postavi nepročitane na 0
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) => ({ ...notif, is_read: true }))
        );
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  return (
    <div className={styles.notificationWrapper}>
      <div className={styles.bellIcon} onClick={toggleNotifications}>
        <FaBell />
        {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount}</span>}
      </div>
      {isOpen && (
        <div className={styles.notificationBar}>
          {notifications.length ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
              >
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
