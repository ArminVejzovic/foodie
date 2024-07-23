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
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username"); // Get stored username

    if (token && storedUsername) {
      // Ako postoji token i username, pokušaj dohvatiti ulogu i preusmjeri na odgovarajući dashboard
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
      // Provjera validnosti tokena
      const response = await axios.get("http://localhost:8000/validate-token", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Ako je token validan, dohvatiti ulogu i preusmjeriti korisnika
      if (response.data.valid) {
        checkUserRoleAndRedirect(token, storedUsername);
      } else {
        // Ako token nije validan, obrisati podatke iz localStorage
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
      const role = roleResponse.data.role.toLowerCase(); // Ensure role is in lowercase
      console.log('Logged in as:', role); // Dodaj log za rolu

      localStorage.setItem("role", role); // Spremi rolu u localStorage

      router.push(`/home-${role}`);
    } catch (error) {
      console.error("Error checking role:", error);
      // U slučaju greške, ne brišemo token
    }
  };

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
      localStorage.setItem("username", username); // Save username to localStorage

      const roleResponse = await axios.get(`http://localhost:8000/get-role/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const role = roleResponse.data.role.toLowerCase(); // Ensure role is in lowercase
      console.log('Logged in as:', role); // Dodaj log za rolu

      localStorage.setItem("role", role); // Spremi rolu u localStorage

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
