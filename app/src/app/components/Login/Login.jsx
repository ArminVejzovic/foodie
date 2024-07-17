"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import axios from "../../../utils/axios";

export default function Login({ onRegisterClick }) {
  const [loginError, setLoginError] = useState(false);
  const [username, setUsername] = useState(""); // Define username state
  const [password, setPassword] = useState(""); // Define password state
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    // Check if the user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      axios.get("http://localhost:8000/get-role/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        // If token is valid, redirect to corresponding home page
        const role = response.data.role.toLowerCase(); // Ensure role is in lowercase
        router.push(`/home-${role}`);
      })
      .catch(error => {
        // If token is invalid, remove it from localStorage
        localStorage.removeItem("token");
      });
    }
  }, [router]);

  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        setLoginError(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [loginError]);

  const onSubmit = async (data) => {
    const formData = new URLSearchParams();
    formData.append('username', username); // Use state variable
    formData.append('password', password); // Use state variable

    try {
      const response = await axios.post("http://localhost:8000/token", formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const token = response.data.access_token;
      localStorage.setItem("token", token);

      const roleResponse = await axios.get(`http://localhost:8000/get-role/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const role = roleResponse.data.role.toLowerCase(); // Ensure role is in lowercase
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button type="submit">Login</button>
      {loginError && <p>Pogresan username/password!</p>}
    </form>
  );
}
