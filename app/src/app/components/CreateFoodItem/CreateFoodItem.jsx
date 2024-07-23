"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CreateFoodItem.module.css';

const CreateFoodItem = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    discount_start: '',
    discount_end: '',
    discount_price: '',
    type_id: '',
    restaurant_id: '',
  });
  const [restaurants, setRestaurants] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const response = await axios.get('http://localhost:8000/restaurants');
      setRestaurants(response.data);
    };

    const fetchFoodTypes = async () => {
      const response = await axios.get('http://localhost:8000/food_types');
      setFoodTypes(response.data);
    };

    fetchRestaurants();
    fetchFoodTypes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/food_items', formData);
      console.log('Food item created:', response.data);
    } catch (error) {
      console.error('Error creating food item:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" />
      <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" required />
      <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="Image URL" />
      <input type="datetime-local" name="discount_start" value={formData.discount_start} onChange={handleChange} />
      <input type="datetime-local" name="discount_end" value={formData.discount_end} onChange={handleChange} />
      <input type="number" name="discount_price" value={formData.discount_price} placeholder='Discount Price' onChange={handleChange} />
      <select name="type_id" value={formData.type_id} onChange={handleChange} required>
        <option value="">Select Food Type</option>
        {foodTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      <select name="restaurant_id" value={formData.restaurant_id} onChange={handleChange} required>
        <option value="">Select Restaurant</option>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.button}>Create Food Item</button>
    </form>
  );
};

export default CreateFoodItem;
