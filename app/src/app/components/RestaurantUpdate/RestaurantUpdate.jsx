"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import styles from './RestaurantUpdate.module.css';
import { FaArrowLeft } from 'react-icons/fa'; 

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const redIcon = new L.Icon({
  iconUrl: '/gps.png',
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

const LocationMarker = ({ setNewLocation, setEditRestaurant }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setNewLocation({ lat, lng });
      setEditRestaurant((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    },
  });
  return null;
};

const RestaurantUpdate = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [editRestaurant, setEditRestaurant] = useState({
    name: '',
    latitude: '',
    longitude: '',
    street: '',
    city: '',
    stars: '',
    category: '',
    distance_limit: ''
  });
  const [newLocation, setNewLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
      const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);
      
      if (role === 'restaurantadmin') {
          setIsAuthorized(true);
      } else {
          console.log('Role does not match admin, redirecting to /notauthenticated');
          router.push('/notauthenticated');
      }
      };

      checkAuth();
  }, [router]);

  useEffect(() => {
    const username = localStorage.getItem('username');

    if (!username) {
      console.error('Username not found');
      return;
    }

    const fetchRestaurantId = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/get-id/${username}`);
        return response.data.id;
      } catch (error) {
        console.error('Error fetching restaurant ID:', error);
      }
    };

    const fetchRestaurant = async () => {
      try {
        const restaurantId = await fetchRestaurantId();
        if (!restaurantId) return;

        const response = await axios.get(`http://localhost:8000/restaurants/${restaurantId}`);
        setRestaurant(response.data);
        setEditRestaurant({
          name: response.data.name,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          street: response.data.street,
          city: response.data.city,
          stars: response.data.stars,
          category: response.data.category,
          distance_limit: response.data.distance_limit
        });
        document.title = response.data.name;
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8000/restaurant-types');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching restaurant categories:', error);
      }
    };

    fetchRestaurant();
    fetchCategories();
  }, []);

  const updateRestaurant = async () => {
    try {
      const restaurantId = restaurant?.id;
      if (!restaurantId) {
        console.error('Restaurant ID not found');
        return;
      }
      await axios.put(`http://localhost:8000/restaurants/${restaurantId}`, editRestaurant);
      alert('Restaurant updated successfully!');
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const resetForm = async () => {
    const username = localStorage.getItem('username');
    const fetchRestaurantId = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/get-id/${username}`);
        return response.data.id;
      } catch (error) {
        console.error('Error fetching restaurant ID:', error);
      }
    };

    const restaurantId = await fetchRestaurantId();
    const response = await axios.get(`http://localhost:8000/restaurants/${restaurantId}`);
    setEditRestaurant({
      name: response.data.name,
      latitude: response.data.latitude,
      longitude: response.data.longitude,
      street: response.data.street,
      city: response.data.city,
      stars: response.data.stars,
      category: response.data.category,
      distance_limit: response.data.distance_limit
    });
    setNewLocation(null);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  
  if(!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
       <button className={styles.backButton} onClick={handleGoBack}>
          <FaArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>{restaurant?.name || 'Update Restaurant'}</h1>
      <p>Pick new location of your restaurant</p>
      <div className={styles.mapContainer}>
        <MapContainer 
          center={[restaurant.latitude, restaurant.longitude]} 
          zoom={13} 
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={[restaurant.latitude, restaurant.longitude]}
          />
          {newLocation && (
            <Marker 
              position={[newLocation.lat, newLocation.lng]}
              icon={redIcon}
            />
          )}
          <LocationMarker setNewLocation={setNewLocation} setEditRestaurant={setEditRestaurant} />
        </MapContainer>
      </div>
      <br />
      <div className={styles.formContainer}>
        <label className={styles.label}>Name</label>
        <input
          type="text"
          placeholder={restaurant.name}
          value={editRestaurant.name}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>Latitude</label>
        <input
          type="text"
          placeholder={restaurant.latitude}
          value={editRestaurant.latitude}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, latitude: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>Longitude</label>
        <input
          type="text"
          placeholder={restaurant.longitude}
          value={editRestaurant.longitude}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, longitude: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>Street</label>
        <input
          type="text"
          placeholder={restaurant.street}
          value={editRestaurant.street}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, street: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>City</label>
        <input
          type="text"
          placeholder={restaurant.city}
          value={editRestaurant.city}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, city: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>Stars</label>
        <input
          type="number"
          placeholder={restaurant.stars}
          value={editRestaurant.stars}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, stars: e.target.value })}
          className={styles.input}
        />
        <label className={styles.label}>Category</label>
        <select
          value={editRestaurant.category}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, category: e.target.value })}
          className={styles.input}
        >
          <option value="" disabled>Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <label className={styles.label}>Distance Limit</label>
        <input
          type="text"
          placeholder={restaurant.distance_limit}
          value={editRestaurant.distance_limit}
          onChange={(e) => setEditRestaurant({ ...editRestaurant, distance_limit: e.target.value })}
          className={styles.input}
        />
        <div className={styles.buttonContainer}>
          <button style={{ marginRight: '10px' }} onClick={updateRestaurant} className={styles.button}>Update</button> 
          <button onClick={resetForm} className={styles.button}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantUpdate;
