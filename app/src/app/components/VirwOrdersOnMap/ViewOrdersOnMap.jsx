"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './ViewOrdersOnMap.module.css';
import { useRouter } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';

const ViewOrdersOnMap = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [selectedDeliverer, setSelectedDeliverer] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Orders on Map - Restaurant Admin";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);

    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role);

      if (role === 'restaurantadmin') {
        setIsAuthorized(true);
        fetchDeliverers();
      } else {
        console.log('Role does not match restaurantadmin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDeliverers = async () => {
    try {
      const username = localStorage.getItem('username');
      const response = await axios.get(`http://localhost:8000/deliverers/${username}`);
      setDeliverers(response.data);
    } catch (error) {
      console.error('Error fetching deliverers:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const formattedDate = formatDate(selectedDate);
      const response = await axios.get(`http://localhost:8000/map/orders`, {
        params: {
          selected_date: formattedDate,
          deliverer_id: selectedDeliverer
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const groupedOrders = orders.reduce((acc, order) => {
    const key = `${order.customer_latitude}-${order.customer_longitude}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(order);
    return acc;
  }, {});

  const getMarkerColor = (status, ordersAtLocation) => {
    if (ordersAtLocation && ordersAtLocation.length > 1) {
      return 'red';
    }
    switch (status) {
      case 'pending':
        return 'blue';
      case 'assigned':
        return 'orange';
      case 'delivered':
        return 'green';
      case 'approved':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const createIcon = (color) => {
    return divIcon({
      html: `<span style="background-color:${color}; border-radius: 50%; width: 12px; height: 12px; display: inline-block;"></span>`,
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={handleGoBack}>
        <FaArrowLeft size={20} />
      </button>
      <h2 className={styles.title}>Orders on Map</h2>
      <div className={styles.legend}>
        <p><span style={{ color: 'blue' }}>●</span> Pending</p>
        <p><span style={{ color: 'orange' }}>●</span> Assigned</p>
        <p><span style={{ color: 'green' }}>●</span> Delivered</p>
        <p><span style={{ color: 'purple' }}>●</span> Approved</p>
        <p><span style={{ color: 'red' }}>●</span> More Orders</p>
      </div>
      <div className={styles.datePickerContainer}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
          maxDate={new Date()}
        />
      </div>
      <div className={styles.delivererDropdown}>
        <select
          value={selectedDeliverer}
          onChange={(e) => setSelectedDeliverer(e.target.value)}
        >
          <option value="">All Deliverers</option>
          {deliverers.map((deliverer) => (
            <option key={deliverer.id} value={deliverer.id}>
              {deliverer.username}
            </option>
          ))}
        </select>
      </div>
      <button className={styles.submitButton} onClick={fetchOrders}>Submit</button>
      <MapContainer center={[43.856430, 18.413029]} zoom={13} className={styles.mapContainer}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.keys(groupedOrders).map(key => {
          const ordersAtLocation = groupedOrders[key];
          const position = [ordersAtLocation[0].customer_latitude, ordersAtLocation[0].customer_longitude];

          return (
            <Marker
              key={key}
              position={position}
              icon={createIcon(getMarkerColor(ordersAtLocation[0].status, ordersAtLocation))}
            >
              <Popup>
                {ordersAtLocation.length > 1 ? (
                  <div className={styles.popupContent}>
                    {ordersAtLocation.map((order, index) => (
                      <div key={order.id}>
                        <b>Order {index + 1}:</b> ID {order.id} <br />
                        <b>Total Price:</b> {order.total_price} <br />
                        <b>Status:</b> <span style={{
                          backgroundColor: getMarkerColor(order.status),
                          borderRadius: '50%',
                          width: '12px',
                          height: '12px',
                          display: 'inline-block',
                          marginLeft: '5px'
                        }}></span> <br />
                        <hr />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.popupContent}> 
                    <b>Order ID:</b> {ordersAtLocation[0].id} <br />
                    <b>Status:</b> <span style={{
                      backgroundColor: getMarkerColor(ordersAtLocation[0].status),
                      borderRadius: '50%',
                      width: '12px',
                      height: '12px',
                      display: 'inline-block',
                      marginLeft: '5px'
                    }}></span> <br />
                    <b>Total Price:</b> {ordersAtLocation[0].total_price} <br />
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default ViewOrdersOnMap;
