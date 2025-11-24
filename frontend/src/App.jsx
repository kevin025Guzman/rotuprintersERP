import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { DialogProvider } from './context/DialogContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Quotations from './pages/Quotations'
import Sales from './pages/Sales'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'
import SimpleInventory from './pages/SimpleInventory'
import SimpleProductForm from './pages/SimpleProductForm'

function App() {
  return (
    <DialogProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route
              index
              element={
                <RestrictedRoute disallowRoles={['DESIGNER']} redirectTo="/sales">
                  <Dashboard />
                </RestrictedRoute>
              }
            />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="simple-inventory" element={<SimpleInventory />} />
            <Route path="simple-inventory/new" element={<SimpleProductForm />} />
            <Route path="simple-inventory/edit/:id" element={<SimpleProductForm />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="sales" element={<Sales />} />
            <Route path="expenses" element={<Expenses />} />
            <Route
              path="reports"
              element={
                <RestrictedRoute disallowRoles={['DESIGNER']} redirectTo="/sales">
                  <Reports />
                </RestrictedRoute>
              }
            />
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </DialogProvider>
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

function RestrictedRoute({ children, disallowRoles = [], redirectTo = '/' }) {
  const { user } = useAuthStore()
  if (user && disallowRoles.includes(user.role)) {
    return <Navigate to={redirectTo} />
  }
  return children
}

export default App
