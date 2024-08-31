import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './FoodItemForm.module.css';
import { useRouter } from 'next/navigation';

const FoodItemForm = ({ onFoodItemSaved, existingFoodItem }) => {
  const initialFoodItemState = {
    name: '',
    description: '',
    price: '',
    image: '',
    discount_start: '',
    discount_end: '',
    discount_price: '',
    type_id: '',
    restaurant_id: '',
    is_active: true,
  };

  const [foodItem, setFoodItem] = useState(existingFoodItem || initialFoodItemState);
  const [foodTypes, setFoodTypes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {

      document.title = "Food items - Restaurant Admin";
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = '/favicon_foodie.png';
      document.head.appendChild(favicon);

      const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);
      
      if (role === 'restaurantadmin') {
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
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found in localStorage');
      setLoading(false);
      return;
    }

    axios.get('http://localhost:8000/food_types')
      .then((response) => {
        setFoodTypes(response.data);
      })
      .catch((error) => {
        console.error('Error fetching food types:', error);
      });

    axios.get('http://localhost:8000/protected-restaurants', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setRestaurants(response.data);
          if (response.data.length === 1) {
            setFoodItem(prevState => ({
              ...prevState,
              restaurant_id: response.data[0].id,
            }));
          }
        } else {
          console.error('Fetched data is not an array:', response.data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching restaurants:', error);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFoodItem({ ...foodItem, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoodItem({ ...foodItem, image: reader.result.split(',')[1] });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFoodItem({ ...foodItem, image: '' });
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const filterEmptyFields = (data) => {
    const filteredData = {};
    for (const key in data) {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        filteredData[key] = data[key];
      }
    }
    return filteredData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const filteredFoodItem = filterEmptyFields(foodItem);

    try {
      const response = await axios.post('http://localhost:8000/food_items', filteredFoodItem, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      onFoodItemSaved(response.data);
      setFoodItem(initialFoodItemState);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      console.error('Error saving food item:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }


  if(!isAuthorized) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.foodItemForm}>
      <input type="text" name="name" value={foodItem.name} onChange={handleChange} placeholder="Name" required />
      <textarea name="description" value={foodItem.description} onChange={handleChange} placeholder="Description" required />
      <input type="number" name="price" value={foodItem.price} onChange={handleChange} placeholder="Price" required />
      <input type="file" name="image" onChange={handleFileChange} ref={fileInputRef} />
      {imagePreview && (
        <div>
          <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
          <button type="button" onClick={handleRemoveImage}>X</button>
        </div>
      )}
      <label>Discount Start (Optional):</label>
      <input type="datetime-local" name="discount_start" value={foodItem.discount_start} onChange={handleChange} />
      <label>Discount End (Optional):</label>
      <input type="datetime-local" name="discount_end" value={foodItem.discount_end} onChange={handleChange} min={foodItem.discount_start} />
      <label>Discount Price (Optional):</label>
      <input type="number" name="discount_price" value={foodItem.discount_price} onChange={handleChange} placeholder="Discount Price" />
      <select name="type_id" value={foodItem.type_id} onChange={handleChange} required>
        <option value="">Select Food Type</option>
        {foodTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
      <select name="restaurant_id" value={foodItem.restaurant_id} onChange={handleChange} required>
        <option value="">Select Restaurant</option>
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
      <button type="submit">Save Food Item</button>
    </form>
  );
};

export default FoodItemForm;
