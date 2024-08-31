"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import styles from './FoodRestaurantTypesCrud.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa'; 

const FoodRestaurantsTypesCrud = () => {
  const [foodTypes, setFoodTypes] = useState([]);
  const [restaurantTypes, setRestaurantTypes] = useState([]);
  const [loadingFoodTypes, setLoadingFoodTypes] = useState(true);
  const [loadingRestaurantTypes, setLoadingRestaurantTypes] = useState(true);
  const [editingFoodType, setEditingFoodType] = useState(null);
  const [editingRestaurantType, setEditingRestaurantType] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const { register: registerFood, handleSubmit: handleSubmitFood, formState: { errors: errorsFood }, reset: resetFood, setValue: setValueFood } = useForm();
  const { register: registerRestaurant, handleSubmit: handleSubmitRestaurant, formState: { errors: errorsRestaurant }, reset: resetRestaurant, setValue: setValueRestaurant } = useForm();
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "CRUD FoodTypes and RestaurantTypes - Admin";
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
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthorized) {
      fetchFoodTypes();
      fetchRestaurantTypes();
    }
  }, [isAuthorized]);

  const fetchFoodTypes = async () => {
    setLoadingFoodTypes(true);
    try {
      const response = await axios.get('http://localhost:8000/food_types');
      setFoodTypes(response.data);
    } catch (error) {
      console.error('Error fetching food types:', error);
    } finally {
      setLoadingFoodTypes(false);
    }
  };

  const fetchRestaurantTypes = async () => {
    setLoadingRestaurantTypes(true);
    try {
      const response = await axios.get('http://localhost:8000/restaurant_types');
      setRestaurantTypes(response.data);
    } catch (error) {
      console.error('Error fetching restaurant types:', error);
    } finally {
      setLoadingRestaurantTypes(false);
    }
  };

  const onSubmitFood = async (data) => {
    try {
      if (editingFoodType) {
        await axios.put(`http://localhost:8000/food_types/${editingFoodType.id}`, data);
      } else {
        await axios.post('http://localhost:8000/food_types', data);
      }
      fetchFoodTypes();
      resetFood();
      setEditingFoodType(null);
    } catch (error) {
      console.error('Error saving food type:', error);
      setErrorMessage('Error saving food type.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const onSubmitRestaurant = async (data) => {
    try {
      if (editingRestaurantType) {
        await axios.put(`http://localhost:8000/restaurant_types/${editingRestaurantType.id}`, data);
      } else {
        await axios.post('http://localhost:8000/restaurant_types', data);
      }
      fetchRestaurantTypes();
      resetRestaurant();
      setEditingRestaurantType(null);
    } catch (error) {
      console.error('Error saving restaurant type:', error);
      setErrorMessage('Error saving restaurant type.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleEditFood = (foodType) => {
    setEditingFoodType(foodType);
    setValueFood('name', foodType.name);
  };

  const handleEditRestaurant = (restaurantType) => {
    setEditingRestaurantType(restaurantType);
    setValueRestaurant('name', restaurantType.name);
  };

  const handleDeleteFood = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/food_types/${id}`);
      fetchFoodTypes();
    } catch (error) {
      console.error('Error deleting food type:', error);
      setErrorMessage('Cannot delete food type. It is referenced by one or more food items.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/restaurant_types/${id}`);
      fetchRestaurantTypes();
    } catch (error) {
      console.error('Error deleting restaurant type:', error);
      setErrorMessage('Cannot delete restaurant type. It is referenced by one or more restaurants.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleGoBack}>
          <FaArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>CRUD Operations</h1>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <section>
        <h2 className={styles.sectionTitle}>Food Types</h2>
        <form onSubmit={handleSubmitFood(onSubmitFood)} className={styles.form}>
          <input {...registerFood('name', { required: 'Name is required' })} placeholder="Food Type Name" className={styles.input} />
          {errorsFood.name && <span className={styles.error}>{errorsFood.name.message}</span>}
          <button type="submit" className={styles.button}>{editingFoodType ? 'Update' : 'Add'} Food Type</button>
          {editingFoodType && <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={() => { resetFood(); setEditingFoodType(null); }}>Cancel</button>}
        </form>
        {loadingFoodTypes ? (
          <p>Loading...</p>
        ) : (
          <ul className={styles.list}>
            {foodTypes.map(foodType => (
              <li key={foodType.id} className={styles.listItem}>
                {foodType.name}
                <button onClick={() => handleEditFood(foodType)} className={styles.button}>Edit</button>
                <button onClick={() => handleDeleteFood(foodType.id)} className={styles.button}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Restaurant Types</h2>
        <form onSubmit={handleSubmitRestaurant(onSubmitRestaurant)} className={styles.form}>
          <input {...registerRestaurant('name', { required: 'Name is required' })} placeholder="Restaurant Type Name" className={styles.input} />
          {errorsRestaurant.name && <span className={styles.error}>{errorsRestaurant.name.message}</span>}
          <button type="submit" className={styles.button}>{editingRestaurantType ? 'Update' : 'Add'} Restaurant Type</button>
          {editingRestaurantType && <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={() => { resetRestaurant(); setEditingRestaurantType(null); }}>Cancel</button>}
        </form>
        {loadingRestaurantTypes ? (
          <p>Loading...</p>
        ) : (
          <ul className={styles.list}>
            {restaurantTypes.map(restaurantType => (
              <li key={restaurantType.id} className={styles.listItem}>
                {restaurantType.name}
                <button onClick={() => handleEditRestaurant(restaurantType)} className={styles.button}>Edit</button>
                <button onClick={() => handleDeleteRestaurant(restaurantType.id)} className={styles.button}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FoodRestaurantsTypesCrud;
