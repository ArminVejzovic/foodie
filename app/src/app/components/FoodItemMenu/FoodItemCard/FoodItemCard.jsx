import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './FoodItemCard.module.css';
import { useRouter } from 'next/navigation';

const FoodItemCard = ({ foodItem, onFoodItemUpdated, onFoodItemDeleted }) => {
  const [typeName, setTypeName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedFoodItem, setEditedFoodItem] = useState({ ...foodItem });
  const [foodTypes, setFoodTypes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [imagePreview, setImagePreview] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem('role');
      
      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
      } else {
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (foodItem) {
      axios.get(`http://localhost:8000/food_types/${foodItem.type_id}`)
        .then(response => setTypeName(response.data.name))
        .catch(error => console.error('Error fetching type:', error));

      axios.get(`http://localhost:8000/restaurants/${foodItem.restaurant_id}`)
        .then(response => setRestaurantName(response.data.name))
        .catch(error => console.error('Error fetching restaurant:', error));
    }
  }, [foodItem]);

  useEffect(() => {
    setEditedFoodItem({ ...foodItem });
    setImagePreview(`data:image/png;base64,${foodItem.image}`);
  }, [foodItem]);

  useEffect(() => {
    axios.get('http://localhost:8000/food_types')
      .then(response => setFoodTypes(response.data))
      .catch(error => console.error('Error fetching food types:', error));

    axios.get('http://localhost:8000/restaurants')
      .then(response => setRestaurants(response.data))
      .catch(error => console.error('Error fetching restaurants:', error));
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const foodItemData = { ...editedFoodItem };

    // Provera da li je image null
    if (!foodItemData.image) {
        foodItemData.image = null;
    }

    axios.put(`http://localhost:8000/food_items/${foodItem.id}`, foodItemData)
        .then(response => {
            setIsEditing(false);
            onFoodItemUpdated(response.data);
        })
        .catch(error => console.error('Error updating food item:', error));
  };

  const handleDeactivate = () => {
    axios.put(`http://localhost:8000/food_items/${foodItem.id}/deactivate`)
      .then(response => {
        onFoodItemUpdated(response.data);
      })
      .catch(error => console.error('Error deactivating food item:', error));
  };

  const handleActivate = () => {
    axios.put(`http://localhost:8000/food_items/${foodItem.id}/activate`)
      .then(response => {
        onFoodItemUpdated(response.data);
      })
      .catch(error => console.error('Error activating food item:', error));
  };

  const handleDelete = () => {
    axios.delete(`http://localhost:8000/food_items/${foodItem.id}`)
      .then(response => {
        onFoodItemDeleted(foodItem.id);
      })
      .catch(error => console.error('Error deleting food item:', error));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedFoodItem({ ...foodItem });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedFoodItem(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditedFoodItem(prevState => ({
                ...prevState,
                image: reader.result.split(',')[1],
            }));
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    } else {
        setEditedFoodItem(prevState => ({
            ...prevState,
            image: null, // Ako fajl nije odabran, postavi image na null
        }));
        setImagePreview('');
    }
};

  const handleRemoveImage = () => {
    setEditedFoodItem(prevState => ({
      ...prevState,
      image: '',
    }));
    setImagePreview('');
  };

  if (!foodItem) return null;

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.foodItemCard}>
      {isEditing ? (
        <div className={styles.editForm}>
          <label className={styles.label}>
            Name:
            <input
              type="text"
              name="name"
              value={editedFoodItem.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </label>
          <label className={styles.label}>
            Description:
            <textarea
              name="description"
              value={editedFoodItem.description}
              onChange={handleChange}
              className={styles.textarea}
              required
            />
          </label>
          <label className={styles.label}>
            Price:
            <input
              type="number"
              name="price"
              value={editedFoodItem.price}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </label>
          <label className={styles.label}>
            Image:
            <input
              type="file"
              onChange={handleFileChange}
              className={styles.input}
            />
            {imagePreview && (
              <div className={styles.imagePreviewContainer}>
                <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                <button type="button" onClick={handleRemoveImage} className={styles.removeImageButton}>X</button>
              </div>
            )}
          </label>
          <label className={styles.label}>
            Discount Start (Optional):
            <input
              type="datetime-local"
              name="discount_start"
              value={editedFoodItem.discount_start}
              onChange={handleChange}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Discount End (Optional):
            <input
              type="datetime-local"
              name="discount_end"
              value={editedFoodItem.discount_end}
              onChange={handleChange}
              className={styles.input}
              min={editedFoodItem.discount_start}
            />
          </label>
          <label className={styles.label}>
            Discount Price (Optional):
            <input
              type="number"
              name="discount_price"
              value={editedFoodItem.discount_price}
              onChange={handleChange}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Select Food Type:
            <select
              name="type_id"
              value={editedFoodItem.type_id}
              onChange={handleChange}
              className={styles.select}
              required
            >
              {foodTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Select Restaurant:
            <select
              name="restaurant_id"
              value={editedFoodItem.restaurant_id}
              onChange={handleChange}
              className={styles.select}
              required
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.buttonContainer}>
            <button onClick={handleSave} className={styles.saveButton}>Save</button>
            <button onClick={handleCancel} className={styles.cancelButton}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h3 className={styles.name}>{foodItem.name}</h3>
          <p className={styles.description}>{foodItem.description}</p>
          <p className={styles.price}>Price: {foodItem.price}</p>
          {foodItem.discount_price && (
            <>
              <p className={styles.discountPrice}>Discount Price: {foodItem.discount_price}</p>
              <p className={styles.discountPeriod}>Discount Period: {foodItem.discount_start} - {foodItem.discount_end}</p>
            </>
          )}
          <p className={styles.type}>Type: {typeName}</p>
          <p className={styles.restaurant}>Restaurant: {restaurantName}</p>
          <p className={styles.isActive}>Active: {foodItem.is_active ? 'Yes' : 'No'}</p>
          {foodItem.image && (
            <img
              src={`data:image/png;base64,${foodItem.image}`}
              height={100}
              width={100}
              alt={foodItem.name}
              className={styles.image}
            />
          )}
          <div className={styles.buttonContainer}>
            <button onClick={handleEdit} className={styles.editButton}>Edit</button>
            <button onClick={foodItem.is_active ? handleDeactivate : handleActivate} className={styles.activateDeactivateButton}>
              {foodItem.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={handleDelete} className={styles.deleteButton}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
};

export default FoodItemCard;
