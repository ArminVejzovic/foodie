"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "../../../utils/axios";
import styles from './Login.module.css';

export default function Login({ onRegisterClick }) {
  const [loginError, setLoginError] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    document.title = "Login - Foodie";
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/favicon_foodie.png';
    document.head.appendChild(favicon);
    
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (token && storedUsername) {
      validateTokenAndRedirect(token, storedUsername);
    }
  }, []);

  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setLoginError(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [loginError]);

  const validateTokenAndRedirect = async (token, storedUsername) => {
    try {
      const response = await axios.get("http://localhost:8000/validate-token", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.valid) {
        checkUserRoleAndRedirect(token, storedUsername);
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
    }
  };

  const checkUserRoleAndRedirect = async (token, storedUsername) => {
    try {
      const roleResponse = await axios.get(`http://localhost:8000/get-role/${storedUsername}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const role = roleResponse.data.role.toLowerCase();
      console.log('Logged in as:', role);

      localStorage.setItem("role", role);

      router.push(`/home-${role}`);
    } catch (error) {
      console.error("Error checking role:", error);
    }
  };

  const onSubmit = async (data) => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    try {
      const response = await axios.post("http://localhost:8000/token", formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const token = response.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("username", data.username);

      const roleResponse = await axios.get(`http://localhost:8000/get-role/${data.username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const role = roleResponse.data.role.toLowerCase();
      console.log('Logged in as:', role);

      localStorage.setItem("role", role);

      router.push(`/home-${role}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setLoginError(true);
      } else {
        setLoginError("Došlo je do greške prilikom prijave. Molimo, pokušajte ponovo.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h1 className={styles.title}>Login</h1>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username:</label>
          <input
            type="text"
            className={styles.input}
            {...register('username', { required: "Username is required" })}
          />
          {errors.username && <p className={styles.error}>{errors.username.message}</p>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            className={styles.input}
            {...register('password', { required: "Password is required" })}
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}
        </div>
        <button type="submit" className={styles.button}>Login</button>
        {loginError && <p className={styles.error}>Pogrešan username/password!</p>}
      </form>
    </div>
  );
}
