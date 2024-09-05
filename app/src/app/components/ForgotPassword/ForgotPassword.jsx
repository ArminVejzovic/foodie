"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './ForgotPassword.module.css'; 

const ForgotPassword = () => {
  const [step, setStep] = useState(1); 
  const [requestData, setRequestData] = useState({
    username: '',
    email: '',
    role: '',
  });
  const [verifyTokenData, setVerifyTokenData] = useState({
    token: '',
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
  });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChangeRequest = (e) => {
    setRequestData({ ...requestData, [e.target.name]: e.target.value });
  };

  const handleChangeVerifyToken = (e) => {
    setVerifyTokenData({ ...verifyTokenData, [e.target.name]: e.target.value });
  };

  const handleChangeResetPassword = (e) => {
    setResetPasswordData({ ...resetPasswordData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/request-password-reset', {
        username: requestData.username,
        email: requestData.email,
        role: requestData.role,
      });
      setMessage(response.data.message); 
      setStep(2); 
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error occurred'; 
      setMessage(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleSubmitVerifyToken = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:8000/verify-reset-token?token=${encodeURIComponent(verifyTokenData.token)}`);
      setMessage(response.data.message); 
      localStorage.setItem('resetToken', verifyTokenData.token); 
      setStep(3); 
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Invalid or expired token';
      setMessage(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const handleSubmitResetPassword = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('resetToken'); 
    if (!token) {
      setMessage('Token not found. Please request a new reset.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/reset-password', {
        token,
        new_password: resetPasswordData.newPassword,
        username: requestData.username, 
        email: requestData.email, 
        role: requestData.role 
      });
      setMessage(response.data.message);
      localStorage.removeItem('resetToken'); 
      router.push('/login'); 
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error occurred while resetting password';
      setMessage(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmitRequest} className={styles.form}>
            <h2>Request Password Reset</h2>
            <input type="text" name="username" placeholder="Username" value={requestData.username} onChange={handleChangeRequest} required className={styles.input}/>
            <input type="email" name="email" placeholder="Email" value={requestData.email} onChange={handleChangeRequest} required className={styles.input}/>
            <select name="role" value={requestData.role} onChange={handleChangeRequest} required className={styles.select}>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="restaurantadmin">Restaurant Admin</option>
              <option value="deliverer">Deliverer</option>
              <option value="customer">Customer</option>
            </select>
            <button type="submit" className={styles.button}>Request Reset</button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleSubmitVerifyToken} className={styles.form}>
            <h2>Verify Reset Token</h2>
            <input type="text" name="token" placeholder="Enter reset token" value={verifyTokenData.token} onChange={handleChangeVerifyToken} required className={styles.inputLong}/>
            <button type="submit" className={styles.button}>Verify Token</button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleSubmitResetPassword} className={styles.form}>
            <h2>Reset Password</h2>
            <div className={styles.passwordContainer}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="newPassword" 
                placeholder="New Password" 
                value={resetPasswordData.newPassword} 
                onChange={handleChangeResetPassword} 
                required 
                className={styles.input}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility} 
                className={styles.toggleButton}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button type="submit" className={styles.button}>Reset Password</button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {renderStep()}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ForgotPassword;
