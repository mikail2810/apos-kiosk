import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ShopPage from './pages/ShopPage'
import CheckoutPage from './pages/CheckoutPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminProductsPage from './pages/AdminProductsPage'
import CustomerAuthPage from './pages/CustomerAuthPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderStatusPage from './pages/OrderStatusPage'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { init } = useAuth()
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<CustomerAuthPage />} />
        <Route path="/profil" element={<CustomerProfilePage />} />
        <Route path="/profil/bestellungen" element={<OrderHistoryPage />} />
        <Route path="/status/:orderId" element={<OrderStatusPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/products" element={<AdminProductsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
