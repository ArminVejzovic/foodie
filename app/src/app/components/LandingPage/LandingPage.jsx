"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './LandingPage.module.css';
import { FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

const LandingPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantTypes, setRestaurantTypes] = useState([]);
  const [foodTypes, setFoodTypes] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelivererForm, setShowDelivererForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [delivererFormData, setDelivererFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [partnerFormData, setPartnerFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = "Foodie";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const fetchData = async () => {
      try {
        const [restaurantsRes, restaurantTypesRes, foodTypesRes] = await Promise.all([
          axios.get('http://localhost:8000/restaurants'),
          axios.get('http://localhost:8000/restaurant_types'),
          axios.get('http://localhost:8000/food_types'),
        ]);

        setRestaurants(restaurantsRes.data);
        setRestaurantTypes(restaurantTypesRes.data);
        setFoodTypes(foodTypesRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRestaurantClick = async (restaurantId) => {
    if (selectedRestaurant && selectedRestaurant.id === restaurantId) {
      setSelectedRestaurant(null);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/restaurants/${restaurantId}/food_items`);
      setSelectedRestaurant({ ...response.data, id: restaurantId });
    } catch (error) {
      console.error('Error fetching food items', error);
    }
  };

  const handleDelivererFormChange = (e) => {
    setDelivererFormData({
      ...delivererFormData,
      [e.target.name]: e.target.value
    });
  };

  const handlePartnerFormChange = (e) => {
    setPartnerFormData({
      ...partnerFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleDelivererFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/apply/deliverer', delivererFormData);
      setMessage(response.data.message);
      setDelivererFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error submitting deliverer form', error);
    }
  };

  const handlePartnerFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/apply/partner', partnerFormData);
      setMessage(response.data.message);
      setPartnerFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error submitting partner form', error);
    }
  };

  const toggleDelivererForm = () => setShowDelivererForm(!showDelivererForm);
  const togglePartnerForm = () => setShowPartnerForm(!showPartnerForm);

  return (
    <div className={styles.landingPage}>
      <header className={styles.header}>
        <div className={styles.logo}>Foodie</div>
        <div className={styles.nav}>
          <a href="/login">
            <button className={styles.navButton}>Login</button>
          </a>
          <a href="/register">
            <button className={styles.navButton}>Register</button>
          </a>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.intro}>
        <h1>Discover the Best Restaurants Near You</h1> 
        <p>Explore the most delicious meals from top-rated restaurants in your area.</p> 
        <p>Whether you're craving local specialties or international cuisine, our platform brings the best dishes directly to your doorstep. Take your dining experience to the next level with just a few clicks.</p> 
        <p>Our easy-to-use interface allows you to browse restaurants, view menus, and place orders effortlessly. Track your delivery and enjoy real-time updates as your meal makes its way to you.</p> 
        <p>Join thousands of satisfied users who rely on our platform for fast, convenient, and delicious food deliveries.</p>
        </section>

        <section className={styles.restaurants}>
          <h2 className={styles.h2}>Popular Restaurants</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            restaurants.map((restaurant) => (
              <div key={restaurant.id} className={styles.dropdown}>
                <button
                  className={styles.dropdownButton}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                >
                  {restaurant.name}
                  <span className={styles.caret}>
                    {selectedRestaurant && selectedRestaurant.id === restaurant.id ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                {selectedRestaurant && selectedRestaurant.id === restaurant.id && (
                  <div className={styles.restaurantDetails}>
                    <ul>
                      {(selectedRestaurant.food_items || []).map((item) => (
                        <li key={item.id} className={styles.foodItem}>
                          {item.image && (
                            <img
                                src={`data:image/jpeg;base64,${item.image}`}
                                alt={item.name}
                                style={{ width: '200px', height: '150px' }}
                                className={styles.foodItemImage}
                            />
                        )}
                          <div className={styles.foodDetails}>
                            <h3>{item.name}</h3>
                            <p>Description: {item.description}</p>
                            <p>Type: {item.type}</p>
                            <p>Price: ${item.price}</p>
                            {item.discount_price && <p>Discount Price: ${item.discount_price}</p>}
                            {item.discount_start && item.discount_end && (
                              <p>Discount Period: {new Date(item.discount_start).toLocaleDateString()} - {new Date(item.discount_end).toLocaleDateString()}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}

        </section>

        <section className={styles.categories}>
          <h2 className={styles.h2}>Popular Restaurant Categories</h2>
          <div className={styles.categoryList}>
            {restaurantTypes.map((type) => (
              <div key={type.id} className={styles.categoryItem}>{type.name}</div>
            ))}
          </div>
        </section>

        <section className={styles.categories}>
          <h2 className={styles.h2}>Popular Food Categories</h2>
          <div className={styles.categoryList}>
            {foodTypes.map((type) => (
              <div key={type.id} className={styles.categoryItem}>{type.name}</div>
            ))}
          </div>
        </section>

        <section className={styles.apply}>
          <h2 onClick={toggleDelivererForm} className={styles.toggleTitle}>
            {showDelivererForm ? 'Deliverer Application Form' : 'Become a Deliverer'}
            <span className={styles.toggleIcon}>
              {showDelivererForm ? <FaTimes /> : <FaChevronDown />}
            </span>
          </h2>
          {showDelivererForm && (
            <form className={styles.applyForm} onSubmit={handleDelivererFormSubmit}>
              <input 
                type="text" 
                name="name" 
                placeholder="Full Name" 
                value={delivererFormData.name} 
                onChange={handleDelivererFormChange} 
                required 
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                value={delivererFormData.email} 
                onChange={handleDelivererFormChange} 
                required 
              />
              <input 
                type="text" 
                name="phone" 
                placeholder="Phone Number" 
                value={delivererFormData.phone} 
                onChange={handleDelivererFormChange} 
                required 
              />
              <button type="submit">Apply Now</button>
            </form>
          )}
        </section>

        <section className={styles.apply}>
          <h2 onClick={togglePartnerForm} className={styles.toggleTitle}>
            {showPartnerForm ? 'Partner Application Form' : 'Become a Partner'}
            <span className={styles.toggleIcon}>
              {showPartnerForm ? <FaTimes /> : <FaChevronDown />}
            </span>
          </h2>
          {showPartnerForm && (
            <form className={styles.applyForm} onSubmit={handlePartnerFormSubmit}>
              <input 
                type="text" 
                name="name" 
                placeholder="Restaurant Name" 
                value={partnerFormData.name} 
                onChange={handlePartnerFormChange} 
                required 
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                value={partnerFormData.email} 
                onChange={handlePartnerFormChange} 
                required 
              />
              <input 
                type="text" 
                name="phone" 
                placeholder="Phone Number" 
                value={partnerFormData.phone} 
                onChange={handlePartnerFormChange} 
                required 
              />
              <button type="submit">Join Us</button>
            </form>
          )}
        </section>

        {message && <p className={styles.message}>{message}</p>}
      </main>

      <footer className={styles.footer}>
        <p>© 2024 Foodie. All rights reserved.</p>
        <div className={styles.footerLinks}>
          <a href="mailto:foodie.restaurants@outlook.com">Contact us</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
