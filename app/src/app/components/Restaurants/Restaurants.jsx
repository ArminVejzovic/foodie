"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';
import styles from './Restaurants.module.css';
import { FaArrowLeft } from 'react-icons/fa'; 

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const Restaurants = () => {
  const [activeRestaurants, setActiveRestaurants] = useState([]);
  const [archivedRestaurants, setArchivedRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    latitude: '',
    longitude: '',
    street: '',
    city: '',
    stars: '',
    category: '',
    distance_limit: ''
  });
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
  const [restaurantTypes, setRestaurantTypes] = useState([]);
  const [loadingRestaurantTypes, setLoadingRestaurantTypes] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.title = "Restaurants - Admin";
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
      setLoading(false);
    };

    checkAuth();
  }, [router]);
  
  useEffect(() => {
    if (isAuthorized) {
      fetchActiveRestaurants();
      fetchArchivedRestaurants();
      fetchRestaurantTypes();
    }
  }, [isAuthorized]);

  const fetchActiveRestaurants = async () => {
    const response = await axios.get('http://localhost:8000/restaurants/active-restaurnats');
    setActiveRestaurants(response.data);
  };

  const fetchArchivedRestaurants = async () => {
    try {
      const response = await axios.get('http://localhost:8000/restaurants/archived-restaurnats');
      setArchivedRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching archived restaurants:', error);
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

  const createRestaurant = async () => {
      if (!newRestaurant.name || !newRestaurant.latitude || !newRestaurant.longitude || !newRestaurant.street || 
        !newRestaurant.city || !newRestaurant.stars || !newRestaurant.category || !newRestaurant.distance_limit) {
      setErrorMessage('All fields are required. Please fill in all fields.');
      setTimeout(() => setErrorMessage(''), 3000); // Clear error after 3 seconds
      return; // Prevent the API call if validation fails
    }
    setIsCreating(true); 
    try {
      await axios.post('http://localhost:8000/restaurants', newRestaurant);
      fetchActiveRestaurants();
      setNewRestaurant({
        name: '',
        latitude: '',
        longitude: '',
        street: '',
        city: '',
        stars: '',
        category: '',
        distance_limit: ''
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setErrorMessage('Error creating restaurant. Please try again.');
      setTimeout(() => setErrorMessage(''), 2000);
    } finally {
      setIsCreating(false);
      setSuccessMessage('Restaurant created successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const updateRestaurant = async () => {
    if (!editRestaurant.name || !editRestaurant.latitude || !editRestaurant.longitude || !editRestaurant.street || 
        !editRestaurant.city || !editRestaurant.stars || !editRestaurant.category || !editRestaurant.distance_limit) {
      setErrorMessage('All fields are required. Please fill in all fields.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsUpdating(true);
    try {
      if (selectedRestaurant) {
        await axios.put(`http://localhost:8000/restaurants/${selectedRestaurant.id}`, editRestaurant);
        fetchActiveRestaurants();
        setSelectedRestaurant(null);
        setEditRestaurant({
          name: '',
          latitude: '',
          longitude: '',
          street: '',
          city: '',
          stars: '',
          category: '',
          distance_limit: ''
        });
        setSuccessMessage('Restaurant updated successfully!');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      setErrorMessage('Error updating restaurant. Please try again.');
      setTimeout(() => setErrorMessage(''), 2000);
    } finally {
      setIsUpdating(false);
    }
  };


  const archiveRestaurant = async (id) => {
    try {
      await axios.put(`http://localhost:8000/restaurants/${id}/archive`);
      fetchActiveRestaurants();
      fetchArchivedRestaurants();
    } catch (error) {
      console.error('Error archiving restaurant:', error);
    }
  };

  const restoreRestaurant = async (id) => {
    try {
      await axios.put(`http://localhost:8000/restaurants/${id}/restore`);
      fetchActiveRestaurants();
      fetchArchivedRestaurants();
    } catch (error) {
      console.error('Error restoring restaurant:', error);
    }
  };

  const handleEditClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setEditRestaurant(restaurant);
  };

  const cancelEdit = () => {
    setSelectedRestaurant(null);
    setEditRestaurant({
      name: '',
      latitude: '',
      longitude: '',
      street: '',
      city: '',
      stars: '',
      category: '',
      distance_limit: ''
    });
  };

  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setNewRestaurant({
          ...newRestaurant,
          latitude: e.latlng.lat.toString(),
          longitude: e.latlng.lng.toString()
        });
        map.flyTo(e.latlng, map.getZoom());
      }
    });

    return newRestaurant.latitude ? (
      <Marker position={[newRestaurant.latitude, newRestaurant.longitude]} />
    ) : null;
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h1 className={styles.title}>Restaurants Management</h1>
      <div className={styles.section}>
        <h2 className={styles.subtitle}>Create Restaurant</h2>
        <p>Pick a location of restaurant</p>
        <MapContainer center={[43.856430, 18.413029]} zoom={15} className={styles.mapContainer}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
        <div className={styles.formGroup}>
          <input
            type="text"
            placeholder="Name"
            value={newRestaurant.name}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Latitude"
            value={newRestaurant.latitude}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, latitude: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Longitude"
            value={newRestaurant.longitude}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, longitude: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Street"
            value={newRestaurant.street}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, street: e.target.value })}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="City"
            value={newRestaurant.city}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
            className={styles.input}
          />
          <input
            type="number"
            placeholder="Stars"
            value={newRestaurant.stars}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, stars: e.target.value })}
            className={styles.input}
          />
          <select
            value={newRestaurant.category}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, category: e.target.value })}
            className={styles.input}
          >
            <option value="">Select Category</option>
            {restaurantTypes.map((type) => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Distance Limit (km)"
            value={newRestaurant.distance_limit}
            onChange={(e) => setNewRestaurant({ ...newRestaurant, distance_limit: e.target.value })}
            className={styles.input}
          />
        </div>
        <button onClick={createRestaurant} className={styles.button} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create'}</button>
        <div className={styles.messages}>
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Active Restaurants</h2>
        {activeRestaurants.length === 0 ? (
          <p>There are no active restaurants.</p>
        ) : (
          <ul className={styles.list}>
            {activeRestaurants.map((restaurant) => (
              <li key={restaurant.id} className={styles.listItem}>
                <strong>{restaurant.name}</strong>
                <div>
                  <button onClick={() => handleEditClick(restaurant)} className={styles.button}>Edit</button>
                  <button onClick={() => archiveRestaurant(restaurant.id)} className={styles.button}>Archive</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedRestaurant && (
        <div className={styles.section}>
          <h2 className={styles.subtitle}>Edit Restaurant</h2>
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Name"
              value={editRestaurant.name}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Latitude"
              value={editRestaurant.latitude}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, latitude: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Longitude"
              value={editRestaurant.longitude}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, longitude: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Street"
              value={editRestaurant.street}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, street: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="City"
              value={editRestaurant.city}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, city: e.target.value })}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Stars"
              value={editRestaurant.stars}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, stars: e.target.value })}
              className={styles.input}
            />
            <select
              value={editRestaurant.category}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, category: e.target.value })}
              className={styles.input}
            >
              <option value="">Select Category</option>
              {restaurantTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Distance Limit (km)"
              value={editRestaurant.distance_limit}
              onChange={(e) => setEditRestaurant({ ...editRestaurant, distance_limit: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button onClick={updateRestaurant} className={styles.button} disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update'}</button>
            <button onClick={cancelEdit} className={styles.button}>Cancel</button>
          </div>
      
        </div>
      )}

      <div className={styles.messages}>
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Archived Restaurants</h2>
        {archivedRestaurants.length === 0 ? (
          <p>There are no archived restaurants.</p>
        ) : (
          <ul className={styles.list}>
            {archivedRestaurants.map((restaurant) => (
              <li key={restaurant.id} className={styles.listItem}>
                <strong>{restaurant.name}</strong>
                <div>
                  <button onClick={() => restoreRestaurant(restaurant.id)} className={styles.button}>Restore</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Restaurants;
