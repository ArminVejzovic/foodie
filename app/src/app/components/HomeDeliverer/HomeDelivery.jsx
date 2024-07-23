"use client";
import React, { useEffect, useState } from 'react';
import Logout from '../Logout/Logout';
import { useRouter } from 'next/navigation';

const HomeDelivery = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const role = localStorage.getItem('role');
    console.log('Role in component:', role); // Dodaj log za rolu u komponenti
    
    if (role !== 'deliverer') {
      console.log('Role does not match deliverer, redirecting to /notauthenticated');
      router.push('/notauthenticated');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      DelivererDashboard
      <Logout />
    </div>
  );
};

export default HomeDelivery;
