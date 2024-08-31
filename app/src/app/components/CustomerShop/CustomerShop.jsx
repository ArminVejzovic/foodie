"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './CustomerShop.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa'; 

const CustomerShop = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [showPaymentMethodPrompt, setShowPaymentMethodPrompt] = useState(false);
    const [itemQuantities, setItemQuantities] = useState({});
    const [restaurantError, setRestaurantError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        document.title = "Shop - Customer";
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = '/favicon_foodie.png';
        document.head.appendChild(favicon);
        const checkAuth = () => {
            const role = localStorage.getItem('role');
            if (role === 'customer') {
                setIsAuthorized(true);
            } else {
                router.push('/notauthenticated');
            }
        };
        checkAuth();
    }, [router]);

    useEffect(() => {
        const username = localStorage.getItem('username');
        if (!username) {
            setError('No username found');
            return;
        }

        axios.get(`http://localhost:8000/restaurants-with-food-items/${username}`)
            .then(response => {
                setRestaurants(response.data);
            })
            .catch(error => {
                setError('Failed to fetch data');
            });
    }, []);

    useEffect(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const europeanDate = now.toISOString().slice(0, 16);
        setDeliveryTime(europeanDate);
    }, []);

    const handleSearch = (event) => {
        setSearchQuery(event.target.value.toLowerCase());
    };

    const addToCart = (item) => {
        const quantity = itemQuantities[item.id] || 1;
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
        const cartRestaurantId = cart.length > 0 ? cart[0].restaurant_id_food_item : item.restaurant_id_food_item;
        if (cart.length > 0 && item.restaurant_id_food_item !== cartRestaurantId) {
            setRestaurantError(`You can only add items from one restaurant at a time.`);
            return;
        } else {
            setRestaurantError('');
        }
    
        if (existingItemIndex !== -1) {
            const updatedCart = cart.map((cartItem, index) => 
                index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem
            );
            setCart(updatedCart);
        } else {
            setCart([...cart, { ...item, quantity }]);
            setRestaurantError("");
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setCart([]);
    };

    const submitOrder = () => {
        if (isSubmitting) return;
    
        if (!paymentMethod) {
            setShowPaymentMethodPrompt(true);
            return;
        }
    
        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }
    
        setIsSubmitting(true);
    
        const orderData = {
            cart: cart.map(item => ({ food_item_id: item.id, quantity: item.quantity })),
            payment_method: paymentMethod,
            delivery_time: deliveryTime
        };
    
        const username = localStorage.getItem('username');
        axios.post(`http://localhost:8000/customer/create-order/${username}`, orderData)
            .then(response => {
                alert('Order placed successfully!');
                clearCart();
            })
            .catch(error => {
                console.error('Error submitting order:', error);
                alert('Failed to place order');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
        setShowPaymentMethodPrompt(false);
    };

    const handleQuantityChange = (itemId, quantity) => {
        if (quantity > 0) {
            setItemQuantities({
                ...itemQuantities,
                [itemId]: quantity
            });
        }
    };

    const filteredRestaurants = restaurants.map(restaurant => ({
        ...restaurant,
        food_items: restaurant.food_items.filter(item => 
            item.name.toLowerCase().startsWith(searchQuery) || 
            item.type.toLowerCase().startsWith(searchQuery))
    })).filter(restaurant => restaurant.food_items.length > 0);

    const toggleCartView = () => {
        setShowCart(!showCart);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    };

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    const handleGoBack = () => {
        router.back();
    };

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className={styles.foodItemsContainer}>
             <button className={styles.backButton} onClick={handleGoBack}>
                <FaArrowLeft size={20} />
            </button>
            <input
                type="text"
                placeholder="Search by name or type..."
                value={searchQuery}
                onChange={handleSearch}
                className={styles.searchBar}
            />
            
            <div className={styles.cartContainer}>
                <div className={styles.cartIconWrapper}>
                    <img 
                        src="/cart-icon.png" 
                        alt="Cart" 
                        className={styles.cartIcon} 
                        onClick={toggleCartView}
                    />
                    {cart.length > 0 && (
                        <div className={styles.cartCount}>
                            {cart.length}
                        </div>
                    )}
                </div>
                {showCart && (
                    <div className={styles.cartDropdown}>
                        <h2>Cart</h2>
                        {restaurantError && <p className={styles.error}>{restaurantError}</p>}
                        {cart.length === 0 ? (
                            <p>Your cart is empty.</p>
                        ) : (
                            <>
                                {cart.map(item => (
                                    <div key={item.id} className={styles.cartItem}>
                                        <h4>{item.name}</h4>
                                        <p>Quantity: {item.quantity}</p>
                                        <p>Total Price: ${(item.price * item.quantity).toFixed(2)}</p>
                                        <button onClick={() => removeFromCart(item.id)} className={styles.removeButton}>Remove</button>
                                    </div>
                                ))}
                                <p className={styles.totalPrice}>Total Price: ${getTotalPrice()}</p>
                                <button onClick={clearCart} className={styles.clearButton}>Clear Cart</button><br />
                                <label htmlFor="deliveryTime">Delivery Time:</label>
                                <input
                                    type="datetime-local"
                                    value={deliveryTime}
                                    onChange={(e) => setDeliveryTime(e.target.value)}
                                    className={styles.deliveryTimeInput}
                                    min={deliveryTime} // Postavljanje minimalnog vremena na trenutni datum i vrijeme
                                />
                                <select
                                    onChange={handlePaymentMethodChange}
                                    value={paymentMethod}
                                    className={styles.paymentSelect}
                                >
                                    <option value="">Select a payment method</option>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="paypal">PayPal</option>
                                    <option value="cash">Cash</option>
                                </select>
                                {showPaymentMethodPrompt && <p className={styles.paymentPrompt}>Please select a payment method</p>}
                                <button onClick={submitOrder} className={styles.submitOrderButton}  disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Order'}</button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {filteredRestaurants.length === 0 ? (
                <div className={styles.noResults}>
                    No items found matching your search.
                </div>
            ) : (
                <>
                {restaurantError && <p className={styles.error}>{restaurantError}</p>}
                    {filteredRestaurants.map(restaurant => (
                        <div key={restaurant.id} className={styles.restaurantSection}>
                            <h1 className={styles.restaurantTitle}>{restaurant.restaurant_name}</h1>
                            {restaurant.food_items.map(item => (
                                <div key={item.id} className={styles.foodItemCard}>
                                    <h4 className={styles.foodItemName}>{item.name}</h4>
                                    {item.image && <img src={`data:image/jpeg;base64,${item.image}`} alt={item.name} className={styles.foodItemImage} />}
                                    <p className={styles.foodItemDescription}>{item.description}</p>
                                    <p className={styles.foodItemPrice}>Price: ${item.price.toFixed(2)}</p>
                                    <div className={styles.orderSection}>
                                        <input
                                            type="number"
                                            value={itemQuantities[item.id] || 1}
                                            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                                            min="1"
                                            className={styles.quantityInputInline}
                                        />
                                        <button onClick={() => addToCart(item)} className={styles.addButton}>Add to Cart</button>
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default CustomerShop;
