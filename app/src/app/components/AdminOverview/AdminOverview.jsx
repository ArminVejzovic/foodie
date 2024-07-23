"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './AdminOverview.module.css'; // Import your CSS module
import { useRouter } from 'next/navigation';

const AdminOverview = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [menus, setMenus] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [deliverers, setDeliverers] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter()
 
  
    const [isAuthorized, setIsAuthorized] = useState(false);

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


    useEffect(() => {
        const fetchData = async () => {
            try {
                const restaurantResponse = await axios.get('http://localhost:8000/all_restaurants');
                const menuResponse = await axios.get('http://localhost:8000/all_menus');
                const orderResponse = await axios.get('http://localhost:8000/all_orders');
                const customerResponse = await axios.get('http://localhost:8000/all_customers');
                const delivererResponse = await axios.get('http://localhost:8000/all_deliverers');

                setRestaurants(restaurantResponse.data);
                setMenus(menuResponse.data);
                setOrders(orderResponse.data);
                setCustomers(customerResponse.data);
                setDeliverers(delivererResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getRestaurantNameById = (id) => {
        const restaurant = restaurants.find(restaurant => restaurant.id === id);
        return restaurant ? restaurant.name : "Unknown";
    };

    const getCustomerNameById = (id) => {
        const customer = customers.find(customer => customer.id === id);
        return customer ? customer.username : "Unknown";
    };

    const getDelivererNameById = (id) => {
        const deliverer = deliverers.find(deliverer => deliverer.id === id);
        return deliverer ? deliverer.username : "Not Assigned";
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.adminOverview}>
            <h1 className={styles.title}>Overview</h1>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Restaurants</h2>
                <ul className={styles.list}>
                    {restaurants.map(restaurant => (
                        <li key={restaurant.id} className={styles.listItem}>
                            {restaurant.name}, {restaurant.city}, {restaurant.street}, {restaurant.stars} stars, {restaurant.category}, {restaurant.distance_limit} km
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Menus</h2>
                <ul className={styles.list}>
                    {menus.map(menu => (
                        <li key={menu.id} className={styles.listItem}>
                            <strong className={styles.listItemTitle}>{menu.name}</strong> - {menu.price} KM
                            <br />
                            <em>Restaurant:</em> {getRestaurantNameById(menu.restaurant_id)}
                            <br />
                            {menu.description}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Orders</h2>
                <ul className={styles.list}>
                    {orders.map(order => (
                        <li key={order.id} className={styles.listItem}>
                            <strong className={styles.listItemTitle}>Order #{order.id}</strong>
                            <br />
                            <em>Restaurant:</em> {getRestaurantNameById(order.restaurant_id)}
                            <br />
                            <em>Customer:</em> {getCustomerNameById(order.customer_id)}
                            <br />
                            <em>Deliverer:</em> {getDelivererNameById(order.deliverer_id)}
                            <br />
                            Total Price: {order.total_price} USD
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminOverview;
