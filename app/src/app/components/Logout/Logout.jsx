"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // Import axios for making HTTP requests

const Logout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      
      localStorage.removeItem('token');

      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
      // Handle error if logout fails
    }
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
}

export default Logout;
