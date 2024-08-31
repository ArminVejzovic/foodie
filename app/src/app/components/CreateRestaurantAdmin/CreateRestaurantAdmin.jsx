"use client";
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import styles from './CreateRestaurantAdmin.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

const CreateRestaurantAdmin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Create Restaurant Admin - Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);
      
      if (role === 'admin') {
        setIsAuthorized(true);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      axios.get('http://localhost:8000/restaurants')
        .then(response => {
          setRestaurants(response.data);
        })
        .catch(error => {
          console.error('Error fetching restaurants:', error);
          setErrorMessage('Failed to fetch restaurants');
        });
    }
  }, [isAuthorized]);

  useEffect(() => {
    let timer;
    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage('');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const onSubmit = async (data) => {
    try {
      await axios.post('http://localhost:8000/create_restaurant_admin', {
        ...data,
        restaurant_id: selectedRestaurant
      });
      alert('Admin created successfully!');
      reset();
      setErrorMessage('');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setErrorMessage('Username already taken');
      } else {
        setErrorMessage('An error occurred while creating the admin.');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Create Restaurant Admin</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && <span className={styles.error}>{errors.username.message}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={styles.input}
                {...register('password', { required: 'Password is required' })}
              />
              <button type="button" className={styles.toggleButton} onClick={togglePasswordVisibility}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="restaurant">Restaurant</label>
            <select
              id="restaurant"
              className={styles.input}
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
            >
              <option value="">Select a restaurant</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          <br />
          <button type="submit" className={styles.submitButton}>Create Restaurant Admin</button>
        </form>
      </div>
    </div>
  );
};

export default CreateRestaurantAdmin;
