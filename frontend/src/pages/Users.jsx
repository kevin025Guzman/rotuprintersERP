import { useEffect, useState } from 'react'
import { userService } from '../services/userService'
import { Plus, X, Trash2, Edit } from 'lucide-react'
import { useDialog } from '../context/DialogContext'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const { alertDialog, confirmDialog } = useDialog()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await userService.getAll()
      setUsers(response.data.results || response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar usuario',
      message: '¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.'
    })
    if (!confirmed) return

    try {
      await userService.delete(userId)
      await alertDialog({ title: 'Éxito', message: 'Usuario eliminado correctamente.' })
      loadUsers()
    } catch (error) {
      await alertDialog({
        title: 'Error',
        message: 'Error al eliminar usuario: ' + (error.response?.data?.detail || error.message)
      })
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <button onClick={() => { setEditingUser(null); setShowModal(true) }} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="table-row">
                <td className="px-6 py-4 text-sm font-medium">{user.username}</td>
                <td className="px-6 py-4 text-sm">{user.first_name} {user.last_name}</td>
                <td className="px-6 py-4 text-sm">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'SELLER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'ADMIN' ? 'Administrador' :
                     user.role === 'SELLER' ? 'Operaciones' : 'Ventas'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setEditingUser(user); setShowModal(true) }}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold mr-4"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal 
          user={editingUser}
          onClose={() => {
            setShowModal(false)
            setEditingUser(null)
          }} 
          onSuccess={() => {
            setShowModal(false)
            setEditingUser(null)
            loadUsers()
          }}
        />
      )}
    </div>
  )
}

function UserModal({ user, onClose, onSuccess }) {
  const isEdit = Boolean(user)
  const defaultForm = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'SELLER',
    is_active: true
  }
  const [formData, setFormData] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const { alertDialog } = useDialog()

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        password_confirm: '',
        role: user.role || 'SELLER',
        is_active: Boolean(user.is_active)
      })
    } else {
      setFormData(defaultForm)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (!isEdit) {
        if (!formData.password || formData.password !== formData.password_confirm) {
          setSaving(false)
          await alertDialog({ title: 'Aviso', message: 'Las contraseñas no coinciden.' })
          return
        }
        await userService.create(formData)
        await alertDialog({ title: 'Éxito', message: 'Usuario creado correctamente' })
      } else {
        const payload = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active,
        }
        await userService.update(user.id, payload)
        await alertDialog({ title: 'Éxito', message: 'Usuario actualizado correctamente' })
      }
      onSuccess()
    } catch (error) {
      await alertDialog({
        title: 'Error',
        message: 'Error al guardar usuario: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message)
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Usuario *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellido *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              {!isEdit && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="input-field"
                      required
                      minLength="8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirmar contraseña *</label>
                    <input
                      type="password"
                      value={formData.password_confirm}
                      onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                      className="input-field"
                      required
                      minLength="8"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="SELLER">Operaciones</option>
                  <option value="DESIGNER">Ventas</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado *</label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                  className="input-field"
                  required
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar Cambios' : 'Crear Usuario')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
