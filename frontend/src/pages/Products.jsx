import { useEffect, useState } from 'react'
import { productService, categoryService } from '../services/productService'
import { simpleInventoryService } from '../services/simpleInventoryService'
import { Plus, Edit, Trash2, Package } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [inventoryProducts, setInventoryProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, inventoryRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        simpleInventoryService.getProducts()
      ])
      setProducts(productsRes.data.results || productsRes.data)
      // Asegurar que categories sea siempre un array
      const categoriesData = categoriesRes.data.results || categoriesRes.data || []
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setInventoryProducts(Array.isArray(inventoryRes) ? inventoryRes : (inventoryRes?.results || []))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de desactivar este producto? El producto no se eliminará pero dejará de aparecer en la lista.')) {
      try {
        await productService.delete(id)
        alert('Producto desactivado correctamente')
        loadData()
      } catch (error) {
        alert('Error al desactivar producto: ' + (error.response?.data?.message || error.message))
      }
    }
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Productos e Inventario</h1>
        <button onClick={() => { setEditingProduct(null); setShowModal(true) }} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Total Productos', value: products.length, icon: Package, color: 'bg-blue-500' },
          { label: 'Stock Bajo', value: products.filter(p => p.stock_status === 'STOCK_BAJO').length, icon: Package, color: 'bg-yellow-500' },
        ].map((stat, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Inventario Relacionado</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Precio por Pulgada²</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => {
              const linkedInventory = inventoryProducts.find(item => item.name === product.category_name)
              return (
                <tr key={product.id} className="table-row">
                  <td className="px-6 py-4 text-sm font-medium">
                    <div>{product.name}</div>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {linkedInventory ? linkedInventory.name : product.category_name || 'Sin inventario'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {linkedInventory ? linkedInventory.quantity : product.quantity_available}
                  </td>
                  <td className="px-6 py-4 text-sm">L {product.price_per_square_inch}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setEditingProduct(product); setShowModal(true) }} className="text-blue-600 hover:text-blue-900 mr-3"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          inventory={inventoryProducts}
          onClose={() => { setShowModal(false); loadData() }}
        />
      )}
    </div>
  )
}

function ProductModal({ product, categories = [], inventory = [], onClose }) {
  const defaultFormState = {
    name: '',
    category: '',
    description: '',
    unit_measure: 'UNIT',
    unit_cost: 0,
    unit_price: 0,
    price_per_square_inch: 0,
    supplier: '',
    minimum_stock: 0,
    is_active: true
  }
  const [formData, setFormData] = useState(product ? { ...defaultFormState, ...product } : defaultFormState)
  const [saving, setSaving] = useState(false)
  
  // Asegurar que categories sea un array
  const categoryList = Array.isArray(categories) ? categories : []
  const inventoryOptions = Array.isArray(inventory) ? inventory : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...formData }
      delete payload.quantity_available
      delete payload.stock_status
      delete payload.is_low_stock
      delete payload.category_name
      delete payload.id
      delete payload.created_at
      delete payload.updated_at

      if (typeof payload.category === 'string' && payload.category.startsWith('inv::')) {
        const inventoryId = payload.category.split('inv::')[1]
        const inventoryItem = inventoryOptions.find(item => String(item.id) === inventoryId)
        const existingCategory = categoryList.find(cat => cat.name === inventoryItem?.name)

        if (existingCategory) {
          payload.category = existingCategory.id
        } else if (inventoryItem) {
          const newCategoryResponse = await categoryService.create({
            name: inventoryItem.name,
            description: inventoryItem.description || ''
          })
          const newCategory = newCategoryResponse.data || newCategoryResponse
          payload.category = newCategory.id
        }
      }

      if (product) {
        await productService.update(product.id, payload)
      } else {
        await productService.create(payload)
      }
      onClose()
    } catch (error) {
      alert('Error al guardar producto: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Nombre del Producto *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {inventoryOptions.length > 0 ? (
                    inventoryOptions.map(item => (
                      <option key={`inv-${item.id}`} value={`inv::${item.id}`}>
                        {item.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No hay productos de inventario disponibles</option>
                  )}
                  {product && formData.category && !String(formData.category).startsWith('inv::') && (
                    <option value={formData.category}>
                      {product.category_name || 'Categoría actual'}
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unidad de Medida *</label>
                <select value={formData.unit_measure} onChange={(e) => setFormData({...formData, unit_measure: e.target.value})} className="input-field">
                  <option value="ROLL">Rollo</option>
                  <option value="SHEET">Lámina</option>
                  <option value="UNIT">Unidad</option>
                  <option value="METER">Metro</option>
                  <option value="SQM">Metro Cuadrado</option>
                  <option value="SQIN">Pulgada Cuadrada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio por Pulgada² (L)</label>
                <input type="number" step="0.01" value={formData.price_per_square_inch} onChange={(e) => setFormData({...formData, price_per_square_inch: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Proveedor</label>
                <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select value={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})} className="input-field">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
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
