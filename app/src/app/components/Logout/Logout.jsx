"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './Logout.module.css';

const Logout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');

      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('An error occurred while logging out. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Logout;
