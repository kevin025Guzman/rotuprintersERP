import { useEffect, useState } from 'react'
import { reportService } from '../services/reportService'
import { BarChart3, DollarSign, Calendar, FileDown } from 'lucide-react'
import { useDialog } from '../context/DialogContext'

export default function Reports() {
  const [salesReport, setSalesReport] = useState(null)
  const [inventoryReport, setInventoryReport] = useState(null)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { alertDialog } = useDialog()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const [sales, inventory, stats] = await Promise.all([
        reportService.getSalesReport(),
        reportService.getInventoryReport(),
        reportService.getDashboardStats()
      ])
      setSalesReport(sales.data)
      setInventoryReport(inventory.data)
      setDashboardStats(stats.data)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const openPdfFromResponse = async (response) => {
    if (!response.ok) throw new Error('Error al generar PDF')
    const data = await response.json()
    const pdfUrl = data.pdf_url || data.url
    if (!pdfUrl) throw new Error('La respuesta no contiene la URL del PDF')
    window.open(pdfUrl, '_self')
  }

  const handleDownloadDailySalesPDF = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/reports/daily-sales-pdf/`
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const token = authStorage?.state?.token
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      await openPdfFromResponse(response)
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'Error al generar PDF: ' + error.message })
    }
  }

  const handleDownloadTotalSalesPDF = async () => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/reports/total-sales-pdf/`
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const token = authStorage?.state?.token
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      await openPdfFromResponse(response)
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'Error al generar PDF: ' + error.message })
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reportes y Análisis</h1>

      {/* Ventas del Día - Card destacada */}
      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">Ventas del Día</h3>
            </div>
            <p className="text-3xl font-bold">
              L {dashboardStats?.sales?.today_amount?.toLocaleString('es-HN', { minimumFractionDigits: 2 }) || '0.00'}
            </p>
            <p className="text-sm opacity-90 mt-1">
              Total: {dashboardStats?.sales?.today_count || 0} venta(s) | Completadas: {dashboardStats?.sales?.today_completed_count || 0}
            </p>
            {(dashboardStats?.sales?.today_count - dashboardStats?.sales?.today_completed_count) > 0 && (
              <p className="text-xs opacity-75 mt-1">
                ⚠️ {dashboardStats?.sales?.today_count - dashboardStats?.sales?.today_completed_count} venta(s) pendiente(s)
              </p>
            )}
            <button
              onClick={handleDownloadDailySalesPDF}
              className="mt-3 flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm"
            >
              <FileDown className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <DollarSign className="w-12 h-12" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" />
              Resumen de Ventas (Total)
            </div>
            <button
              onClick={handleDownloadTotalSalesPDF}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
              title="Descargar PDF de todas las ventas"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Ventas</span>
              <span className="font-bold">L {salesReport?.summary?.total_sales?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cantidad</span>
              <span className="font-bold">{salesReport?.summary?.total_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Promedio</span>
              <span className="font-bold">L {salesReport?.summary?.average_sale?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <div className="space-y-2">
            {salesReport?.top_products?.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{product.product}</span>
                <span className="font-semibold">L {product.amount?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Inventario por Categoría</h3>
          <div className="space-y-2">
            {inventoryReport?.categories?.map((cat, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{cat.category}</span>
                <span className="font-semibold">{cat.total_products} productos</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Productos con Stock Bajo</h3>
          <div className="space-y-2">
            {inventoryReport?.low_stock_products?.slice(0, 5).map((product, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{product.name}</span>
                <span className="font-semibold text-red-600">{product.quantity_available}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
