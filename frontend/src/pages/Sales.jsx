import { useEffect, useState } from 'react'
import { saleService } from '../services/saleService'
import { clientService } from '../services/clientService'
import { productService } from '../services/productService'
import { Plus, Eye, CheckCircle, XCircle, FileDown, Trash2, Filter, X as CloseIcon } from 'lucide-react'
import { format } from 'date-fns'

export default function Sales() {
  const [allSales, setAllSales] = useState([])
  const [filteredSales, setFilteredSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewingSale, setViewingSale] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const initialFilters = {
    status: '',
    payment_method: '',
    search: '',
    date_from: '',
    date_to: ''
  }
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [appliedFilters, allSales])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))
    if (page > totalPages) {
      setPage(1)
    }
  }, [filteredSales.length, page, pageSize])

  const loadSales = async () => {
    try {
      setLoading(true)
      const response = await saleService.getAll()
      const data = response.data?.results || response.data || []
      const list = Array.isArray(data) ? data : []
      setAllSales(list)
      setFilteredSales(list)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allSales]

    if (appliedFilters.search) {
      const term = appliedFilters.search.toLowerCase()
      filtered = filtered.filter((sale) =>
        sale.client_name?.toLowerCase().includes(term) ||
        sale.invoice_number?.toLowerCase().includes(term) ||
        sale.created_by_username?.toLowerCase().includes(term)
      )
    }

    if (appliedFilters.status) {
      filtered = filtered.filter((sale) => sale.status === appliedFilters.status)
    }

    if (appliedFilters.payment_method) {
      filtered = filtered.filter((sale) => sale.payment_method === appliedFilters.payment_method)
    }

    if (appliedFilters.date_from) {
      const fromDate = new Date(appliedFilters.date_from)
      filtered = filtered.filter((sale) => new Date(sale.created_at) >= fromDate)
    }

    if (appliedFilters.date_to) {
      const toDate = new Date(appliedFilters.date_to)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((sale) => new Date(sale.created_at) <= toDate)
    }

    setFilteredSales(filtered)
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))
  const paginatedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize)

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setPage(newPage)
  }

  const handleComplete = async (id) => {
    if (window.confirm('¿Completar esta venta? Esto actualizará el inventario.')) {
      try {
        await saleService.complete(id)
        loadSales()
        alert('Venta completada exitosamente')
      } catch (error) {
        alert('Error al completar venta')
      }
    }
  }

  const handleCancel = async (id) => {
    if (window.confirm('¿Cancelar esta venta?')) {
      try {
        await saleService.cancel(id)
        loadSales()
      } catch (error) {
        alert('Error al cancelar venta')
      }
    }
  }

  const handleView = async (id) => {
    try {
      const response = await saleService.getById(id)
      setViewingSale(response.data)
    } catch (error) {
      alert('Error al cargar detalles de la venta')
    }
  }

  const handleDownloadPDF = async (id) => {
    try {
      // Crear un enlace temporal para descargar el PDF
      const sale = allSales.find(s => s.id === id)
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/sales/${id}/generate_pdf/`
      
      // Obtener el token de autenticación
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}')
      const token = authStorage?.state?.token
      
      // Hacer la petición con fetch para obtener el blob
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Error al generar PDF')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `Factura_${sale?.invoice_number || id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      alert('Error al generar PDF: ' + error.message)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ventas y Facturas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            {showFilters ? <CloseIcon className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            Filtros
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Venta
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field"
                placeholder="Cliente, factura o vendedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de pago</label>
              <select
                value={filters.payment_method}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                className="input-field"
              >
                <option value="">Todas</option>
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desde</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hasta</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="btn-outline"
              onClick={handleClearFilters}
            >
              Limpiar
            </button>
            <button
              className="btn-primary"
              onClick={handleApplyFilters}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase"># Factura</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vendedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Pago</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className="table-row">
                <td className="px-6 py-4 text-sm font-medium">{sale.invoice_number}</td>
                <td className="px-6 py-4 text-sm">{sale.client_name}</td>
                <td className="px-6 py-4 text-sm">{sale.created_by_username}</td>
                <td className="px-6 py-4 text-sm">{sale.payment_method}</td>
                <td className="px-6 py-4 text-sm font-semibold">L {parseFloat(sale.total_amount).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sale.status === 'PENDING' ? 'Pendiente' :
                     sale.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{format(new Date(sale.created_at), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleView(sale.id)} className="text-blue-600 hover:text-blue-900 mr-2" title="Ver detalles"><Eye className="w-5 h-5" /></button>
                  {sale.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleComplete(sale.id)} className="text-green-600 hover:text-green-900 mr-2" title="Completar venta"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => handleCancel(sale.id)} className="text-red-600 hover:text-red-900 mr-2" title="Cancelar venta"><XCircle className="w-5 h-5" /></button>
                    </>
                  )}
                  {sale.status === 'COMPLETED' && (
                    <button onClick={() => handleDownloadPDF(sale.id)} className="text-purple-600 hover:text-purple-900" title="Descargar PDF"><FileDown className="w-5 h-5" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Página {page} de {totalPages} — {filteredSales.length} registros
          </div>
          <div className="flex gap-2">
            <button
              className="btn-outline"
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
            >
              Anterior
            </button>
            <button
              className="btn-outline"
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showModal && <SaleModal onClose={() => { setShowModal(false); loadSales() }} />}
      {viewingSale && <SaleDetailModal sale={viewingSale} onClose={() => setViewingSale(null)} />}
    </div>
  )
}

function SaleModal({ onClose }) {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    client: '',
    payment_method: 'CASH',
    discount_percentage: 0,
    notes: '',
    items: []
  })
  const [applyTax, setApplyTax] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        clientService.getAll(),
        productService.getAll()
      ])
      setClients(clientsRes.data.results || clientsRes.data)
      setProducts(productsRes.data.results || productsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, unit_price: 0 }]
    })
  }

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    
    if (field === 'product') {
      const product = products.find(p => p.id === parseInt(value))
      if (product) {
        newItems[index].unit_price = product.unit_price
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price || 0) * parseInt(item.quantity || 0))
    }, 0)
  }

  const calculateISV = () => {
    return applyTax ? calculateSubtotal() * 0.15 : 0
  }

  const calculateDiscount = () => {
    return calculateSubtotal() * (parseFloat(formData.discount_percentage || 0) / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateISV() - calculateDiscount()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.items.length === 0) {
      alert('Debe agregar al menos un producto')
      return
    }
    setSaving(true)
    try {
      // Preparar datos incluyendo tax_rate
      const saleData = {
        ...formData,
        tax_rate: applyTax ? 15 : 0  // Enviar tax_rate basado en el checkbox
      }
      await saleService.create(saleData)
      onClose()
    } catch (error) {
      console.error('Error completo:', error.response?.data)
      alert('Error al crear venta: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Nueva Venta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <select value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} className="input-field" required>
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago *</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="input-field">
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descuento (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})} className="input-field" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="applyTax" 
                checked={applyTax} 
                onChange={(e) => setApplyTax(e.target.checked)} 
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="applyTax" className="text-sm font-medium cursor-pointer">
                Aplicar ISV (15%)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field" placeholder="Notas adicionales..." />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Productos</h3>
                <button type="button" onClick={addItem} className="btn-primary flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Producto
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="col-span-6">
                    <label className="block text-xs mb-1">Producto *</label>
                    <select value={item.product} onChange={(e) => updateItem(index, 'product', e.target.value)} className="input-field text-sm" required>
                      <option value="">Seleccionar producto...</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name} - L{prod.unit_price} (Stock: {prod.quantity_available})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1">Cantidad *</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="input-field text-sm" required />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs mb-1">Precio Unit. (L) *</label>
                    <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} className="input-field text-sm" required />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>L {calculateSubtotal().toFixed(2)}</span>
                </div>
                {applyTax && (
                  <div className="flex justify-between text-lg">
                    <span>ISV (15%):</span>
                    <span>L {calculateISV().toFixed(2)}</span>
                  </div>
                )}
                {formData.discount_percentage > 0 && (
                  <div className="flex justify-between text-lg text-green-600">
                    <span>Descuento ({formData.discount_percentage}%):</span>
                    <span>- L {calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>L {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creando...' : 'Crear Venta'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function SaleDetailModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Detalles de Venta</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Información General</h3>
              <div className="space-y-2">
                <div><span className="font-medium">Factura #:</span> {sale.invoice_number}</div>
                <div><span className="font-medium">Cliente:</span> {sale.client_name}</div>
                <div><span className="font-medium">Vendedor:</span> {sale.created_by_username}</div>
                <div><span className="font-medium">Fecha:</span> {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</div>
                <div><span className="font-medium">Método de Pago:</span> {
                  sale.payment_method === 'CASH' ? 'Efectivo' : 'Transferencia'
                }</div>
                <div>
                  <span className="font-medium">Estado:</span>{' '}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sale.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sale.status === 'PENDING' ? 'Pendiente' :
                     sale.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Resumen Financiero</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>L {parseFloat(sale.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ISV (15%):</span>
                  <span>L {parseFloat(sale.tax_amount || 0).toFixed(2)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento ({sale.discount_percentage}%):</span>
                    <span>- L {parseFloat(sale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>L {parseFloat(sale.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {sale.items && sale.items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Productos</h3>
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase">Cantidad</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase">Precio Unit.</th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{item.product_name}</td>
                        <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">L {parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold">L {(item.quantity * item.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sale.notes && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Notas</h3>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">{sale.notes}</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button onClick={onClose} className="btn-primary">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
