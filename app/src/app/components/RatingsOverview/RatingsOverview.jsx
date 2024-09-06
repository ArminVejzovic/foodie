"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './RatingsOverview.module.css';

const RatingsOverview = ({ username }) => {
  const [ratings, setRatings] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

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
  }, [username]);

  return (
    <div className={styles.ratingsWrapper}>
      <h2>Ratings Overview</h2>
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      {ratings.length > 0 ? (
        <div className={styles.ratingList}>
          {ratings.map((rating) => (
            <div key={rating.id} className={styles.ratingItem}>
              <p><strong>Rating:</strong> {rating.rating}/5</p>
              <p><strong>Comment:</strong> {rating.comment || "No comment"}</p>
              <p><strong>Date:</strong> {new Date(rating.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No ratings available.</p>
      )}
    </div>
  );
};

export default RatingsOverview;
