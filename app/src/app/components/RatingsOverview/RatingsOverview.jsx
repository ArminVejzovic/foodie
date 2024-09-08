"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RatingsOverview.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa'; 

const RatingsOverview = () => {
  const [ratings, setRatings] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Ratings Overview - Restaurant Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);

      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        console.log('Role does not match admin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const username = localStorage.getItem("username");
        const response = await axios.get(`http://localhost:8000/ratings/${username}`);
        setRatings(response.data);
      } catch (error) {
        setErrorMessage("No ratings found or error fetching ratings.");
      }
    };

    fetchRatings();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
       <button onClick={handleGoBack} className={styles.backButton}>
        <FaArrowLeft size={20}/>
      </button>
      <div className={styles.ratingsWrapper}>
        <h2 className={styles.heading}>Ratings Overview</h2>
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {ratings.length > 0 ? (
          <div className={styles.ratingList}>
            {ratings.map((rating) => (
              <div key={rating.id} className={styles.ratingItem}>
                <p><strong>Rating:</strong> {rating.rating}/5</p>
                <p><strong>Comment:</strong> {rating.comment || "No comment"}</p>
                <p><strong>Date:</strong> {new Date(rating.created_at).toLocaleDateString()}</p>
                {rating.customer && (
                  <p><strong>Customer:</strong> {rating.customer.username} ({rating.customer.email})</p>
                )}
                {rating.restaurant && (
                  <p><strong>Restaurant:</strong> {rating.restaurant.name}, {rating.restaurant.street}</p>
                )}
                {rating.order && (
                  <p><strong>Order ID:</strong> {rating.order.id}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No ratings available.</p>
        )}
      </div>
    </div>
  );
};

export default RatingsOverview;
