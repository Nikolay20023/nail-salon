import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { initTelegramWebApp } from './utils/telegram'
import MyBooking from './pages/MyBooking'
import CreateBooking from './pages/CreateBooking'
import UpdateBooking from './pages/UpdateBooking'
import DeleteBooking from './pages/DeleteBooking'
import AdminPanel from './pages/AdminPanel'
import AdminUsers from './pages/admin/AdminUsers'
import AdminServices from './pages/admin/AdminServices'
import AdminMasters from './pages/admin/AdminMasters'
import AdminBookings from './pages/admin/AdminBookings'
import './styles/App.css'

function App() {
  useEffect(() => {
    console.log('App component mounted')
    console.log('Current pathname:', window.location.pathname)
    try {
      initTelegramWebApp()
      console.log('Telegram WebApp initialized')
    } catch (error) {
      console.error('Error initializing Telegram WebApp:', error)
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--tg-theme-bg-color, #ffffff)' }}>
      <Routes>
        <Route path="/" element={<MyBooking />} />
        <Route path="/my-booking" element={<MyBooking />} />
        <Route path="/create-booking" element={<CreateBooking />} />
        <Route path="/update-booking/:id" element={<UpdateBooking />} />
        <Route path="/delete-booking/:id" element={<DeleteBooking />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="/admin/masters" element={<AdminMasters />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
      </Routes>
    </div>
  )
}

export default App

