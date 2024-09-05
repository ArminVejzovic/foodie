"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./Register.module.css";
import Link from "next/link";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const LocationMarker = ({ setLatitude, setLongitude }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      console.log(`Lat: ${lat}, Lng: ${lng}`);
      setLatitude(lat);
      setLongitude(lng);
    }
  });

  return null;
};

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Register - Foodie";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post("http://localhost:8000/register/customer", {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      router.push("/login");
    } catch (error) {
      console.error("Error registering", error);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Register Customer</h2>
        <p>Pick your location</p>
        <div className={styles.mapContainer}>
          <MapContainer
            center={[43.856430, 18.413029]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "270px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker setLatitude={setLatitude} setLongitude={setLongitude} />
            {latitude && longitude && (
              <Marker position={[parseFloat(latitude), parseFloat(longitude)]}>
                <Popup>
                  {`Lat: ${latitude}, Lng: ${longitude}`}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username:</label>
          <input type="text" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>First Name:</label>
          <input type="text" className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Last Name:</label>
          <input type="text" className={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Address:</label>
          <input type="text" className={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Latitude:</label>
          <input type="text" className={styles.input} value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Longitude:</label>
          <input type="text" className={styles.input} value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </div>
        <button type="submit" className={styles.submitButton}>Register</button>
      </form>
      <p className={styles.accountText}>
        Already have an account? <Link href="/login" className={styles.loginLink}>Login</Link>
      </p>
    </div>
  );
}
