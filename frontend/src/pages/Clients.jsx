import { useEffect, useState } from 'react'
import { clientService } from '../services/clientService'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { useDialog } from '../context/DialogContext'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const { alertDialog, confirmDialog } = useDialog()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await clientService.getAll({ search: searchTerm })
      setClients(response.data.results || response.data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadClients()
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar cliente',
      message: '¿Está seguro de eliminar este cliente?'
    })
    if (!confirmed) return
    try {
      await clientService.delete(id)
      loadClients()
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'Error al eliminar cliente' })
    }
  }

  const handleEdit = async (client) => {
    try {
      const response = await clientService.getById(client.id)
      setEditingClient(response.data || response)
      setShowModal(true)
    } catch (error) {
      console.error('Error fetching client details:', error)
      await alertDialog({ title: 'Error', message: 'Error al cargar información del cliente' })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <button onClick={() => { setEditingClient(null); setShowModal(true) }} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar clientes..."
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-primary">
          <Search className="w-5 h-5" />
        </button>
      </form>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {clients.map((client) => (
              <tr key={client.id} className="table-row">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client.company || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{client.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-900 mr-3">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <ClientModal client={editingClient} onClose={() => { setShowModal(false); loadClients() }} />}
    </div>
  )
}

function ClientModal({ client, onClose }) {
  const defaultForm = {
    name: '', company: '', phone: '', email: '', address: '', rtn: '', notes: '', is_active: true
  }
  const [formData, setFormData] = useState(client ? { ...defaultForm, ...client } : defaultForm)
  const [saving, setSaving] = useState(false)
  const { alertDialog } = useDialog()

  useEffect(() => {
    setFormData(client ? { ...defaultForm, ...client } : defaultForm)
  }, [client])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (client) {
        await clientService.update(client.id, formData)
      } else {
        await clientService.create(formData)
      }
      onClose()
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'Error al guardar cliente' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Empresa</label>
                <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RTN</label>
                <input type="text" value={formData.rtn} onChange={(e) => setFormData({...formData, rtn: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select value={formData.is_active ? 'true' : 'false'} onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})} className="input-field">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input-field" rows="2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field" rows="2" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
