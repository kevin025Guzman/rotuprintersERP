import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { simpleInventoryService } from '../services/simpleInventoryService';

export default function SimpleProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    quantity: 0
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const loadProduct = async () => {
        try {
          const product = await simpleInventoryService.getProduct(id);
          setFormData({
            name: product.name || '',
            description: product.description || '',
            sku: product.sku || '',
            quantity: product.quantity || 0
          });
        } catch (error) {
          console.error('Error loading product:', error);
          setError('Error al cargar el producto');
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        await simpleInventoryService.updateProduct(id, formData);
      } else {
        await simpleInventoryService.createProduct(formData);
      }
      navigate('/simple-inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Error al guardar el producto. Verifica los datos e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditing 
              ? 'Actualiza la información del producto' 
              : 'Completa el formulario para agregar un nuevo producto'}
          </p>
        </div>
        <Link 
          to="/simple-inventory" 
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Ej: Taza personalizada 12oz"
                required
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código (SKU) *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Ej: TAZA-12OZ"
                required
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad Inicial
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="input-field w-full"
                placeholder="0"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="input-field w-full"
                placeholder="Descripción detallada del producto..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/simple-inventory"
            className="btn-secondary flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
