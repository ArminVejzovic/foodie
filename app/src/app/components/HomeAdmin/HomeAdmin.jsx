"use client";
import React, { useEffect, useState } from 'react';
import Logout from '../Logout/Logout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AdminDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem('role');
      console.log('Role in component:', role); // Log role for debugging
      
      if (role !== 'admin') {
        console.log('Role does not match admin, redirecting to /notauthenticated');
        router.push('/notauthenticated');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h3>AdminDashboard</h3>
      <Link href="/admin/restaurants">Restaurants</Link><br></br>
      <Link href="/admin/create-admin">Create Admin</Link><br></br>
      <Link href="/admin/food-restaurant-types-crud">Food Restaurants Types Crud</Link><br></br>
      <Link href="/admin/overview">Overview</Link><br></br>
      <Logout />
    </div>
  );
};

export default AdminDashboard;
