import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Package, 
  Search, Filter, Sliders, X, PlusCircle
} from 'lucide-react';
import { simpleInventoryService } from '../services/simpleInventoryService';

export default function SimpleInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sku: '',
    min_quantity: '',
    max_quantity: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm, ...filters };
      const data = await simpleInventoryService.getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchTerm, filters]);

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await simpleInventoryService.deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const handleAdjustStock = async (productId, adjustment) => {
    try {
      const quantity = parseInt(adjustment, 10);
      if (isNaN(quantity)) return;
      
      await simpleInventoryService.adjustStock(productId, quantity, 'Ajuste manual');
      loadProducts();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Error al ajustar el inventario');
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Inventario Simple
          </h1>
          <p className="text-sm text-gray-500">
            Gestión básica de productos y existencias
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            {showFilters ? <X size={16} /> : <Filter size={16} />}
            Filtros
          </button>
          <Link
            to="/simple-inventory/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código (SKU)</label>
              <input
                type="text"
                value={filters.sku}
                onChange={(e) => setFilters({ ...filters, sku: e.target.value })}
                className="input-field"
                placeholder="Filtrar por código"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cant. Mínima</label>
              <input
                type="number"
                value={filters.min_quantity}
                onChange={(e) => setFilters({ ...filters, min_quantity: e.target.value })}
                className="input-field"
                placeholder="Mínimo"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cant. Máxima</label>
              <input
                type="number"
                value={filters.max_quantity}
                onChange={(e) => setFilters({ ...filters, max_quantity: e.target.value })}
                className="input-field"
                placeholder="Máximo"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 w-full"
          placeholder="Buscar productos..."
        />
      </div>

      {/* Tabla de productos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center">
                    Cantidad
                    {sortConfig.key === 'quantity' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.quantity <= 0 
                            ? 'bg-red-100 text-red-800' 
                            : product.quantity < 10 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {product.quantity} unidades
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const adjustment = prompt('Ingrese la cantidad a sumar (o restar con -)');
                              if (adjustment !== null) {
                                handleAdjustStock(product.id, parseInt(adjustment, 10));
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Ajustar inventario"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const quantity = parseInt(prompt('Nueva cantidad:', product.quantity), 10);
                              if (!isNaN(quantity)) {
                                const adjustment = quantity - product.quantity;
                                handleAdjustStock(product.id, adjustment);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-green-600"
                            title="Establecer cantidad exacta"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/simple-inventory/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
