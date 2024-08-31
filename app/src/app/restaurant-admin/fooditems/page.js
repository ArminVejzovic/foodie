"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import FoodItemForm from '../../components/FoodItemMenu/FoodItemForm/FoodItemForm.jsx';
import FoodItemCard from '../../components/FoodItemMenu/FoodItemCard/FoodItemCard.jsx';
import styles from '../../components/FoodItemMenu/FoodItemForm/FoodItemForm.module.css';
import { FaArrowLeft } from 'react-icons/fa'; 
import { useRouter } from 'next/navigation';

const FoodItemsPage = () => {
  const [foodItems, setFoodItems] = useState([]);
  const router = useRouter();

  const fetchFoodItems = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.get('http://localhost:8000/protected-food_items', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setFoodItems(response.data);
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const handleFoodItemSaved = (foodItem) => {
    setFoodItems([...foodItems, foodItem]);
  };

  const handleFoodItemUpdated = (updatedFoodItem) => {
    setFoodItems(prevItems => prevItems.map(item => item.id === updatedFoodItem.id ? updatedFoodItem : item));
  };

  const handleFoodItemDeleted = (deletedFoodItemId) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== deletedFoodItemId));
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className={styles.foodItemsPage}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h1 style={{textAlign: 'center'}}>Food Items</h1>
      <FoodItemForm onFoodItemSaved={handleFoodItemSaved} />
      <div className={styles.foodItemList}>
        {foodItems.map((foodItem, index) => (
          <FoodItemCard 
            key={index} 
            foodItem={foodItem}
            onFoodItemUpdated={handleFoodItemUpdated}
            onFoodItemDeleted={handleFoodItemDeleted}
          />
        ))}
      </div>
    </div>
  );
};

export default FoodItemsPage;
