import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Quotations from './pages/Quotations'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="products" element={<Products />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user } = useAuthStore()
  return user?.role === 'ADMIN' ? children : <Navigate to="/" />
}

export default App
