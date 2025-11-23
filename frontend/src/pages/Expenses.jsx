import { useEffect, useMemo, useState } from 'react'
import { Plus, FileDown, Calendar, Search, Receipt } from 'lucide-react'
import { format } from 'date-fns'

import { expenseService } from '../services/expenseService'
import { useDialog } from '../context/DialogContext'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ search: '', start_date: '', end_date: '' })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const { alertDialog } = useDialog()

  useEffect(() => {
    loadExpenses()
  }, [appliedFilters])

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (appliedFilters.search) params.search = appliedFilters.search
      if (appliedFilters.start_date) params.start_date = appliedFilters.start_date
      if (appliedFilters.end_date) params.end_date = appliedFilters.end_date

      const response = await expenseService.getAll(params)
      const data = response.data?.results || response.data
      setExpenses(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'No se pudieron cargar los gastos.' })
    } finally {
      setLoading(false)
    }
  }

  const openPdfWithToken = (url) => {
    const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    const token = authStorage?.state?.token
    if (!token) {
      alertDialog({ title: 'Error', message: 'No se encontró el token de autenticación.' })
      return
    }
    const separator = url.includes('?') ? '&' : '?'
    window.open(`${url}${separator}token=${token}`, '_self')
  }

  const handleDownloadPdf = () => {
    const params = new URLSearchParams()
    if (appliedFilters.start_date) params.append('start_date', appliedFilters.start_date)
    if (appliedFilters.end_date) params.append('end_date', appliedFilters.end_date)
    if (appliedFilters.search) params.append('search', appliedFilters.search)

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'
    openPdfWithToken(`${baseUrl}/expenses/export_pdf/${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize
    return expenses.slice(start, start + pageSize)
  }, [expenses, page])

  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize))

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0)
  }, [expenses])

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    const reset = { search: '', start_date: '', end_date: '' }
    setFilters(reset)
    setAppliedFilters(reset)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            Gastos Operativos
          </h1>
          <p className="text-sm text-gray-500">Registra y controla los gastos diarios de la empresa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadPdf} className="btn-outline flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Descargar PDF
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Gasto Total</p>
          <p className="text-2xl font-bold text-primary mt-1">L {totalAmount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Gastos Registrados</p>
          <p className="text-2xl font-bold mt-1">{expenses.length}</p>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field pl-10"
              placeholder="Buscar descripción"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Desde</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hasta</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={handleResetFilters} className="btn-secondary">Limpiar</button>
          <button type="submit" className="btn-primary">Aplicar filtros</button>
        </div>
      </form>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Monto (L)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Registrado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="table-row">
                  <td className="px-6 py-4 text-sm">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-sm">{expense.description}</td>
                  <td className="px-6 py-4 text-sm font-semibold">L {parseFloat(expense.amount).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm">{expense.created_by_name || 'N/D'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-6 text-center text-gray-500">No hay gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showModal && (
        <ExpenseModal
          onClose={() => { setShowModal(false); loadExpenses() }}
        />
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="btn-secondary"
        disabled={page === 1}
      >
        Anterior
      </button>
      <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="btn-secondary"
        disabled={page === totalPages}
      >
        Siguiente
      </button>
    </div>
  )
}

function ExpenseModal({ onClose }) {
  const { alertDialog } = useDialog()
  const [formData, setFormData] = useState({
    description: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.description.trim()) {
      await alertDialog({ title: 'Aviso', message: 'La descripción es obligatoria.' })
      return
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      await alertDialog({ title: 'Aviso', message: 'Ingrese un monto válido.' })
      return
    }
    setSaving(true)
    try {
      await expenseService.create({ ...formData, amount: parseFloat(formData.amount) })
      await alertDialog({ title: 'Éxito', message: 'Gasto registrado correctamente.' })
      onClose()
    } catch (error) {
      await alertDialog({ title: 'Error', message: 'No se pudo registrar el gasto.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-xl w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Nuevo Gasto</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Descripción *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monto (L)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
