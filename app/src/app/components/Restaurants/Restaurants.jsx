"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRouter } from 'next/navigation';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
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
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role); // Log role for debugging
      
      if (role === 'admin') {
        setIsAuthorized(true);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
      setLoading(false); // Always set loading to false at the end
    };

    checkAuth();
  }, [router]);
  
  if (!isAuthorized) {
    return null;
  }

  if(loading) return <div>Loading...</div>

  const fetchRestaurants = async () => {
    const response = await axios.get('http://localhost:8000/restaurants');
    setRestaurants(response.data);
  };

  const fetchActiveRestaurants = async () => {
    const response = await axios.get('http://localhost:8000/restaurants/active');
    setActiveRestaurants(response.data);
  };

  const fetchArchivedRestaurants = async () => {
    const response = await axios.get('http://localhost:8000/restaurants/archived');
    setArchivedRestaurants(response.data);
  };

  useEffect(() => {
    fetchRestaurants();
    fetchActiveRestaurants();
    fetchArchivedRestaurants();
  }, []);

  const createRestaurant = async () => {
    try {
      await axios.post('http://localhost:8000/restaurants', newRestaurant);
      fetchRestaurants();
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
    }
  };

  const updateRestaurant = async () => {
    try {
      if (selectedRestaurant) {
        await axios.put(`http://localhost:8000/restaurants/${selectedRestaurant.id}`, editRestaurant);
        fetchRestaurants();
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
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const archiveRestaurant = async (id) => {
    try {
      await axios.put(`http://localhost:8000/restaurants/${id}/archive`);
      fetchRestaurants();
      fetchActiveRestaurants();
      fetchArchivedRestaurants();
    } catch (error) {
      console.error('Error archiving restaurant:', error);
    }
  };

  const restoreRestaurant = async (id) => {
    try {
      await axios.put(`http://localhost:8000/restaurants/${id}/restore`);
      fetchRestaurants();
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Restaurants Management</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>Create Restaurant</h2>
        <p>Pick a location of restaurant</p>
        <MapContainer center={[43.856430, 18.413029]} zoom={15} style={{ height: '400px', marginTop: '20px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
        <br></br>
        <input
          type="text"
          placeholder="Name"
          value={newRestaurant.name}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Latitude"
          value={newRestaurant.latitude}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, latitude: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Longitude"
          value={newRestaurant.longitude}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, longitude: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Street"
          value={newRestaurant.street}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, street: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="City"
          value={newRestaurant.city}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="number"
          placeholder="Stars"
          value={newRestaurant.stars}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, stars: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Category"
          value={newRestaurant.category}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, category: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="text"
          placeholder="Distance Limit"
          value={newRestaurant.distance_limit}
          onChange={(e) => setNewRestaurant({ ...newRestaurant, distance_limit: e.target.value })}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <br></br>
        <button onClick={createRestaurant} style={{ padding: '5px 10px' }}>Create</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Active Restaurants</h2>
        <ul>
          {activeRestaurants.map((restaurant) => (
            <li key={restaurant.id} style={{ marginBottom: '10px' }}>
              {restaurant.name}
              <button
                onClick={() => handleEditClick(restaurant)}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                Edit
              </button>
              <button
                onClick={() => archiveRestaurant(restaurant.id)}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                Archive
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedRestaurant && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Edit Restaurant</h2>
          <input
            type="text"
            placeholder="Name"
            value={editRestaurant.name}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Latitude"
            value={editRestaurant.latitude}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, latitude: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Longitude"
            value={editRestaurant.longitude}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, longitude: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Street"
            value={editRestaurant.street}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, street: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="City"
            value={editRestaurant.city}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, city: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Stars"
            value={editRestaurant.stars}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, stars: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Category"
            value={editRestaurant.category}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, category: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="text"
            placeholder="Distance Limit"
            value={editRestaurant.distance_limit}
            onChange={(e) => setEditRestaurant({ ...editRestaurant, distance_limit: e.target.value })}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={updateRestaurant} style={{ padding: '5px 10px' }}>Update</button>
          <button onClick={cancelEdit} style={{ padding: '5px 10px', marginLeft: '10px' }}>Cancel</button>
        </div>
      )}

      <div>
        <h2>Archived Restaurants</h2>
        <ul>
          {archivedRestaurants.map((restaurant) => (
            <li key={restaurant.id} style={{ marginBottom: '10px' }}>
              {restaurant.name}
              <button
                onClick={() => restoreRestaurant(restaurant.id)}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Restaurants;
