import { useState } from 'react'
import { userService } from '../services/userService'
import { useDialog } from '../context/DialogContext'
import { useAuthStore } from '../store/authStore'

const defaultForm = {
  old_password: '',
  new_password: '',
  new_password_confirm: ''
}

export default function Profile() {
  const { user } = useAuthStore()
  const { alertDialog } = useDialog()
  const [formData, setFormData] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (!formData.old_password || !formData.new_password || !formData.new_password_confirm) {
      await alertDialog({ title: 'Aviso', message: 'Complete todos los campos.' })
      return
    }
    if (formData.new_password !== formData.new_password_confirm) {
      await alertDialog({ title: 'Aviso', message: 'Las nuevas contraseñas no coinciden.' })
      return
    }

    setSaving(true)
    try {
      await userService.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        new_password_confirm: formData.new_password_confirm
      })
      await alertDialog({ title: 'Éxito', message: 'Contraseña actualizada correctamente.' })
      setFormData(defaultForm)
    } catch (error) {
      const detail = error.response?.data
      const message = typeof detail === 'object'
        ? Object.values(detail).flat().join(' ')
        : (detail || error.message)
      await alertDialog({ title: 'Error', message: `No se pudo cambiar la contraseña. ${message}` })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">Perfil de Usuario</h1>
        <p className="text-gray-500 dark:text-gray-400">Configura los datos de tu cuenta.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Información</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Nombre</dt>
            <dd className="text-base font-medium">{user?.first_name} {user?.last_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Usuario</dt>
            <dd className="text-base font-medium">{user?.username}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Correo</dt>
            <dd className="text-base font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Rol</dt>
            <dd className="text-base font-medium">
              {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'SELLER' ? 'Operaciones' : 'Ventas'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña actual</label>
            <input
              type="password"
              className="input-field"
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              value={formData.new_password_confirm}
              onChange={(e) => setFormData({ ...formData, new_password_confirm: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
