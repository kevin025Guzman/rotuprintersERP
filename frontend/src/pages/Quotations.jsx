import { useEffect, useState } from 'react'
import { quotationService } from '../services/quotationService'
import { clientService } from '../services/clientService'
import { productService } from '../services/productService'
import { Plus, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function Quotations() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    try {
      const response = await quotationService.getAll()
      setQuotations(response.data.results || response.data)
    } catch (error) {
      console.error('Error loading quotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await quotationService.approve(id)
      loadQuotations()
    } catch (error) {
      alert('Error al aprobar cotización')
    }
  }

  const handleReject = async (id) => {
    if (window.confirm('¿Rechazar esta cotización?')) {
      try {
        await quotationService.reject(id)
        loadQuotations()
      } catch (error) {
        alert('Error al rechazar cotización')
      }
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cotizaciones</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Cotización
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase"># Cotización</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vendedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {quotations.map((quotation) => (
              <tr key={quotation.id} className="table-row">
                <td className="px-6 py-4 text-sm font-medium">{quotation.quotation_number}</td>
                <td className="px-6 py-4 text-sm">{quotation.client_name}</td>
                <td className="px-6 py-4 text-sm">{quotation.created_by_username}</td>
                <td className="px-6 py-4 text-sm font-semibold">L {parseFloat(quotation.total_amount).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    quotation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    quotation.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                    quotation.status === 'CONVERTED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quotation.status === 'PENDING' ? 'Pendiente' :
                     quotation.status === 'APPROVED' ? 'Aprobada' :
                     quotation.status === 'CONVERTED' ? 'Convertida' : 'Rechazada'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{format(new Date(quotation.created_at), 'dd/MM/yyyy')}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-900 mr-2"><Eye className="w-5 h-5" /></button>
                  {quotation.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(quotation.id)} className="text-green-600 hover:text-green-900 mr-2"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => handleReject(quotation.id)} className="text-red-600 hover:text-red-900"><XCircle className="w-5 h-5" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <QuotationModal onClose={() => { setShowModal(false); loadQuotations() }} />}
    </div>
  )
}

function QuotationModal({ onClose }) {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    client: '',
    notes: '',
    items: []
  })
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
      items: [...formData.items, { product: '', description: '', width_inches: 0, height_inches: 0, quantity: 1, price_per_square_inch: 0 }]
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
    setFormData({ ...formData, items: newItems })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      if (item.width_inches && item.height_inches && item.price_per_square_inch) {
        const squareInches = parseFloat(item.width_inches) * parseFloat(item.height_inches)
        const itemTotal = squareInches * parseFloat(item.price_per_square_inch) * parseInt(item.quantity || 1)
        return sum + itemTotal
      }
      return sum
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.items.length === 0) {
      alert('Debe agregar al menos un item')
      return
    }
    setSaving(true)
    try {
      await quotationService.create(formData)
      onClose()
    } catch (error) {
      alert('Error al crear cotización: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Nueva Cotización</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Notas</label>
                <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Items</h3>
                <button type="button" onClick={addItem} className="btn-primary flex items-center text-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Item
                </button>
              </div>

              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="col-span-3">
                    <label className="block text-xs mb-1">Producto *</label>
                    <select value={item.product} onChange={(e) => updateItem(index, 'product', e.target.value)} className="input-field text-sm" required>
                      <option value="">Seleccionar...</option>
                      {products.map(prod => (
                        <option key={prod.id} value={prod.id}>{prod.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs mb-1">Descripción</label>
                    <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="input-field text-sm" placeholder="Detalles adicionales" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs mb-1">Ancho (") *</label>
                    <input type="number" step="0.01" min="0" value={item.width_inches} onChange={(e) => updateItem(index, 'width_inches', e.target.value)} className="input-field text-sm" required />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs mb-1">Alto (") *</label>
                    <input type="number" step="0.01" min="0" value={item.height_inches} onChange={(e) => updateItem(index, 'height_inches', e.target.value)} className="input-field text-sm" required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1">Precio/pulg² (L) *</label>
                    <input type="number" step="0.01" min="0" value={item.price_per_square_inch} onChange={(e) => updateItem(index, 'price_per_square_inch', e.target.value)} className="input-field text-sm" required />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs mb-1">Cant. *</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="input-field text-sm" required />
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
              <div className="text-right">
                <p className="text-2xl font-bold">Total: L {calculateTotal().toFixed(2)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creando...' : 'Crear Cotización'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
