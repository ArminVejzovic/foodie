"use client";
import React, { useEffect, useState } from 'react';
import Logout from '../Logout/Logout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './HomeAdmin.module.css';

const HomeAdmin = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Admin Home - Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);

      if (role === 'admin') {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
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
        <div className={styles.card}>
          <div className={styles.icon}>🍴</div>
          <Link href="/admin/restaurants" className={styles.cardLink}>
            Manage Restaurants
          </Link>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>👤</div>
          <Link href="/admin/create-admin" className={styles.cardLink}>
            Create Admin
          </Link>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>👥</div>
          <Link href="/admin/create-restaurant-admin" className={styles.cardLink}>
            Create Restaurant Admin
          </Link>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>📂</div>
          <Link href="/admin/food-restaurant-types-crud" className={styles.cardLink}>
            Manage Food & Restaurant Types
          </Link>
        </div>
        <div className={styles.card}>
          <div className={styles.icon}>📊</div>
          <Link href="/admin/overview" className={styles.cardLink}>
            Restaurant Overview
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
