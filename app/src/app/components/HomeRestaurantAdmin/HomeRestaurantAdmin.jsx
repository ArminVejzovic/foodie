import React from 'react'
import Logout from '../Logout/Logout.jsx'
import Link from 'next/link.js'

const RestaurantAdmin = () => {
  return (
    <div>
      RestaurantAdmin<br></br>
      <Link href="/restaurant-admin/create-food-item">Kreiraj food item</Link><br></br>
      <Link href="/restaurant-admin/create-group-menu">Kreiraj grupni menu</Link><br></br>
      <Link href="/admin/create-admin">Create Admin</Link><br></br>
      <Link href="/admin/food-restaurant-types-crud">Food Restaurant Types Crud</Link><br></br>
      <Logout />
    </div>
  )
}

export default RestaurantAdmin