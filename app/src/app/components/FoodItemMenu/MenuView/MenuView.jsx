"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './MenuView.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

const MenuView = () => {
    const [foodData, setFoodData] = useState({ restaurant_name: '', food_items: [] });
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        document.title = "Restaurant Menu - Restaurant Admin";
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
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        const username = localStorage.getItem('username');

        if (!username) {
            console.error('No username found in localStorage');
            setError('No username found');
            return;
        }

        axios.get(`http://localhost:8000/active_food_items?username=${username}`)
            .then(response => {
                if (response.data.food_items.length === 0) {
                    setError('No food items available for this restaurant.');
                } else {
                    setFoodData(response.data);
                }
            })
            .catch(error => {
                console.error('Error fetching food items:', error);
                setError('Failed to fetch food items');
            });
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <button className={styles.backButton} onClick={handleGoBack}>
                    <FaArrowLeft size={20} />
                </button>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className={styles.foodItemsContainer}>
            <button className={styles.backButton} onClick={handleGoBack}>
                <FaArrowLeft size={20} />
            </button>
            <h1 className={styles.restaurantTitle}>{foodData.restaurant_name}</h1>
            <h2 className={styles.header}>Restaurant Menu</h2>
            {foodData.food_items.map(group => (
                <div key={group.food_type} className={styles.foodTypeSection}>
                    <h3 className={styles.foodTypeHeader}>{group.food_type}</h3>
                    <div className={styles.foodItemsGrid}>
                        {group.food_items.map(item => (
                            <div key={item.id} className={styles.foodItemCard}>
                                <h4 className={styles.foodItemName}>{item.name}</h4>
                                {item.image && <img src={`data:image/jpeg;base64,${item.image}`} alt={item.name} className={styles.foodItemImage} />}
                                <p className={styles.foodItemDescription}>{item.description}</p>
                                <p className={styles.foodItemPrice}>Price: ${item.price.toFixed(2)}</p>
                                {item.discount_price && (
                                    <p className={styles.foodItemDiscount}>
                                        Discount Price: ${item.discount_price.toFixed(2)}
                                        <br />
                                        <span className={styles.discountPeriod}>
                                            {`(${new Date(item.discount_start).toLocaleDateString()} - ${new Date(item.discount_end).toLocaleDateString()})`}
                                        </span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MenuView;
