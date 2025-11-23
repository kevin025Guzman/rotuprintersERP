import { useEffect, useState } from 'react'
import { reportService } from '../services/reportService'
import { DollarSign, FileText, Package, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await reportService.getDashboardStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const manualLowStock = stats?.inventory?.manual_low_stock || []
  const manualLowStockNames = manualLowStock
    .slice(0, 3)
    .map((item) => item.name)
    .join(', ')
  const manualLowStockSubtitle = manualLowStock.length > 0
    ? `${manualLowStockNames}${manualLowStock.length > 3 ? ` +${manualLowStock.length - 3} más` : ''}`
    : 'Sin alertas'

  const statCards = [
    {
      title: 'Ventas del Día',
      value: `L ${stats?.sales?.today_amount?.toLocaleString('es-HN', { minimumFractionDigits: 2 }) || '0.00'}`,
      subtitle: `${stats?.sales?.today_count || 0} venta(s) (${stats?.sales?.today_completed_count || 0} completadas)`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Ventas (30 días)',
      value: `L ${stats?.sales?.recent_30_days?.toLocaleString('es-HN', { minimumFractionDigits: 2 }) || '0.00'}`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
    {
      title: 'Cotizaciones Activas',
      value: stats?.quotations?.active || 0,
      icon: FileText,
      color: 'bg-primary',
    },
    {
      title: 'Clientes',
      value: stats?.clients?.total || 0,
      icon: Users,
      color: 'bg-secondary',
    },
    {
      title: 'Stock bajo (Inventario manual)',
      value: manualLowStock.length,
      subtitle: manualLowStockSubtitle,
      icon: Package,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido al sistema de gestión de RotuPrinters
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                  {stat.change && (
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts */}
      {stats?.inventory?.low_stock > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Productos con stock bajo: {stats.inventory.low_stock}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                Revisa el inventario para reabastecer productos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estado del Inventario
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total de Productos</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.inventory?.total_products || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Stock Bajo</span>
              <span className="font-semibold text-yellow-600">
                {stats?.inventory?.low_stock || 0}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Inventario manual ({manualLowStock.length} con stock ≤ {stats?.inventory?.manual_low_stock_threshold || 3})
              </p>
              {manualLowStock.length > 0 ? (
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {manualLowStock.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold text-red-600">{item.quantity}</span>
                    </li>
                  ))}
                  {manualLowStock.length > 5 && (
                    <li className="text-xs text-gray-500">+{manualLowStock.length - 5} más...</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin alertas</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen de Ventas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Ventas Completadas</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.sales?.total_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Ventas Pendientes</span>
              <span className="font-semibold text-yellow-600">
                {stats?.sales?.pending_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Cotizaciones</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats?.quotations?.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
