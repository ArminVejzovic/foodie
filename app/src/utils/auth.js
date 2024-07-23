import axios from './axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const checkAuthAndRole = (requiredRole) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Dodaj log za token

      if (!token) {
        console.log('No token found, redirecting to /notauthenticated');
        router.push('/notauthenticated');
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/get-role', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const role = response.data.role.toLowerCase();
        console.log('Role from server:', role); // Dodaj log za rolu

        if (role !== requiredRole) {
          console.log(`Role ${role} does not match required role ${requiredRole}, redirecting to /notauthenticated`);
          router.push('/notauthenticated');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log('Error during role verification:', error);
        router.push('/notauthenticated');
      }
    };

    verifyAuth();
  }, [router, requiredRole]);

  return { loading };
};
