import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  LayoutDashboard, Users, Package, FileText, DollarSign, 
  BarChart3, Settings, LogOut, Menu, X, Moon, Sun
} from 'lucide-react'
import { useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDark, toggleDarkMode } = useDarkMode()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Productos', href: '/products', icon: Package },
    { name: 'Inventario', href: '/simple-inventory', icon: Package },
    { name: 'Cotizaciones', href: '/quotations', icon: FileText },
    { name: 'Ventas', href: '/sales', icon: DollarSign },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
  ]

  if (user?.role === 'ADMIN') {
    navigation.push({ name: 'Usuarios', href: '/users', icon: Settings })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="RotuPrinters Logo" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary"
              />
              <h1 className="text-xl font-bold text-primary">RotuPrinters</h1>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'ADMIN' ? 'Administrador' : 
                   user?.role === 'SELLER' ? 'Vendedor' : 'Diseñador'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sistema de Gestión
            </h2>
          </div>
          
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
