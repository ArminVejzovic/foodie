"use client";
import { useRouter } from 'next/navigation';
import styles from './NotAuthenticated.module.css';

const NotAuthenticated = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <div className={styles.container}>
      <p className={styles.message}>Niste autentificirani. Molimo prijavite se.</p>
      <button className={styles.button} onClick={handleLogin}>Login</button>
      <button className={styles.button} onClick={handleRegister}>Register</button>
      <button className={styles.button} onClick={handleHome}>Foodie Home</button>
    </div>
  );
};

export default NotAuthenticated;
