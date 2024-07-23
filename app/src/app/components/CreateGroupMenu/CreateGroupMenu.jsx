"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CreateGroupMenu.module.css';

const CreateGroupMenu = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    discount_start: '',
    discount_end: '',
    discount_price: '',
    restaurant_id: '',
    item_ids: [],
  });
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      const response = await axios.get('http://localhost:8000/restaurants');
      setRestaurants(response.data);
    };

    const fetchFoodItems = async () => {
      const response = await axios.get('http://localhost:8000/food_items');
      setFoodItems(response.data);
    };

    fetchRestaurants();
    fetchFoodItems();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemSelection = (e) => {
    const selectedOption = e.target.value;
    if (selectedOption && !selectedItems.includes(selectedOption)) {
      setSelectedItems([...selectedItems, selectedOption]);
      setFormData({ ...formData, item_ids: [...formData.item_ids, selectedOption] });
    }
  };

  const handleRemoveItem = (item) => {
    setSelectedItems(selectedItems.filter(i => i !== item));
    setFormData({ ...formData, item_ids: formData.item_ids.filter(i => i !== item) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/group_menus', formData);
      console.log('Group menu created:', response.data);
    } catch (error) {
      console.error('Error creating group menu:', error);
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
      <input type="number" name="discount_price" value={formData.discount_price} onChange={handleChange} />
      <select name="restaurant_id" value={formData.restaurant_id} onChange={handleChange} required>
        <option value="">Select Restaurant</option>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
      <div className={styles.selectedItemsContainer}>
        {selectedItems.map((item) => {
          const foodItem = foodItems.find(foodItem => foodItem.id === item);
          return foodItem ? (
            <div key={item} className={styles.selectedItem}>
              {foodItem.name}
              <button type="button" onClick={() => handleRemoveItem(item)}>Remove</button>
            </div>
          ) : null;
        })}
      </div>
      <select value="" onChange={handleItemSelection}>
        <option value="">Select Food Items</option>
        {foodItems.filter(item => !selectedItems.includes(item.id)).map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <button type="submit" className={styles.button}>Create Group Menu</button>
    </form>
  );
};

export default CreateGroupMenu;
