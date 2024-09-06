import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import styles from "./ReviewForm.module.css";

const ReviewForm = () => {
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchLatestOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/orders/rateable/${username}`);
        setOrder(response.data);
      } catch (error) {
        setErrorMessage("Nema narudžbina za ocjenjivanje.");
      }
    };

    fetchLatestOrder();
  }, [username]);

  const toggleReviewForm = () => {
    setIsOpen(!isOpen);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!order) {
      setErrorMessage("Nema narudžbina za ocjenjivanje.");
      return;
    }

    try {
      await axios.post(`http://localhost:8000/orders/rating/${username}`, { rating, comment });
      setSuccessMessage("Uspješno ste ocijenili narudžbinu!");
      setOrder(null);
      setIsOpen(false);
    } catch (error) {
      setErrorMessage(error.response.data.detail || "Došlo je do greške.");
    }
  };

  return (
    <div className={styles.reviewWrapper}>
      <div className={styles.starIcon} onClick={toggleReviewForm}>
        <FaStar />
      </div>
      {isOpen && (
        <div className={styles.reviewBar}>
          <h2>Ocijeni narudžbinu</h2>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
          {order ? (
            <form onSubmit={submitReview} className={styles.form}>
              <div className={styles.rating}>
                <label>Ocjena:</label>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    className={`${styles.star} ${rating >= star ? styles.selected : ""}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div>
                <label>Komentar:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                ></textarea>
              </div>
              <button type="submit" className={styles.submitButton}>Pošalji ocjenu</button>
            </form>
          ) : (
            <p>Nema narudžbina za ocjenjivanje.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewForm;
