"use client";
import React, { useEffect, useState } from 'react';
import Logout from '../Logout/Logout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './HomeCustomer.module.css';

const HomeCustomer = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Customer Dashboard - Restaurant App";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);

      if (role === 'customer') {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        console.log('Role does not match customer, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <p>Loading...</p>;

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
     <header className={styles.header}>
        <Logout className={styles.logout} />
        <h3 className={styles.title}>Admin Dashboard</h3>
        <div className={styles.scrollIndicator}>⬇️</div>
      </header>
      <div className={styles.cardsContainer}>
        <Link href="/customer/shop" className={styles.card}>
          <div className={styles.icon}>🛒</div>
          <span className={styles.cardLink}>Shop</span>
        </Link>

        <Link href="/customer/orders-overview" className={styles.card}>
          <div className={styles.icon}>📦</div>
          <span className={styles.cardLink}>Order Overview</span>
        </Link>
      </div>
    </div>
  );
};

export default HomeCustomer;
