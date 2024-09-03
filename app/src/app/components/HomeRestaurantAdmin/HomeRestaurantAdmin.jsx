"use client";
import React, { useEffect, useState } from 'react';
import Logout from '../Logout/Logout.jsx';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation';
import styles from './HomeRestaurantAdmin.module.css';

const HomeRestaurantAdmin = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Restaurant Admin Home - Restaurant Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);

      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return <p>Loading...</p>;
  }
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
     <header className={styles.header}>
        <Logout className={styles.logout} />
        <h3 className={styles.title}>Restaurant Admin Dashboard</h3>
        <div className={styles.scrollIndicator}>⬇️</div>
      </header>
      <div className={styles.cardsContainer}>
        <Link href="/restaurant-admin/fooditems" className={styles.card}>
          <div className={styles.icon}>🍔</div>
          <span className={styles.cardLink}>Kreiraj Food Item</span>
        </Link>
        <Link href="/restaurant-admin/menus" className={styles.card}>
          <div className={styles.icon}>📋</div>
          <span className={styles.cardLink}>Grupni Menu</span>
        </Link>
        <Link href="/restaurant-admin/create-deliverer" className={styles.card}>
          <div className={styles.icon}>
            🚗👤
          </div>
          <span className={styles.cardLink}>Create Deliverer</span>
        </Link>

        <Link href="/restaurant-admin/orders" className={styles.card}>
          <div className={styles.icon}>
            📦✅
          </div>
          <span className={styles.cardLink}>Odobravanje Narudžbi</span>
        </Link>
        <Link href="/restaurant-admin/restaurant-update" className={styles.card}>
          <div className={styles.icon}>
            🏪✏️
          </div>
          <span className={styles.cardLink}>Update Restaurant</span>
        </Link>
        <Link href="/restaurant-admin/orders-map" className={styles.card}>
          <div className={styles.icon}>
            📍🗺️
          </div>
          <span className={styles.cardLink}>View Orders on Map</span>
        </Link>

      </div>
    </div>
  );
};

export default HomeRestaurantAdmin;
