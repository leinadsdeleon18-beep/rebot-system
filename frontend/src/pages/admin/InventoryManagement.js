import React, { useState } from 'react';
import { Package, AlertCircle, Plus, Edit, Trash2, Search, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const mockInventory = [
  { id: 1, item: 'Biscuit', stock: 45, threshold: 20, unit: 'pieces', lastRestocked: '2026-03-25', category: 'Food' },
  { id: 2, item: 'Chocolate Bar', stock: 30, threshold: 20, unit: 'pieces', lastRestocked: '2026-03-24', category: 'Food' },
  { id: 3, item: 'Juice Box', stock: 28, threshold: 20, unit: 'pieces', lastRestocked: '2026-03-23', category: 'Beverage' },
  { id: 4, item: 'Pencil Set', stock: 20, threshold: 15, unit: 'sets', lastRestocked: '2026-03-22', category: 'Supplies' },
  { id: 5, item: 'Notebook', stock: 15, threshold: 15, unit: 'pieces', lastRestocked: '2026-03-21', category: 'Supplies' },
  { id: 6, item: 'Eraser', stock: 100, threshold: 30, unit: 'pieces', lastRestocked: '2026-03-20', category: 'Supplies' },
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [formData, setFormData] = useState({ 
    item: '', 
    stock: '', 
    threshold: 20, 
    unit: 'pieces', 
    category: 'Supplies' 
  });

  const totalItems = inventory.reduce((sum, i) => sum + i.stock, 0);
  const lowStockItems = inventory.filter(i => i.stock <= i.threshold).length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.stock * 25), 0);

  const handleSubmit = () => {
    if (!formData.item) { 
      toast.error('Please enter item name'); 
      return; 
    }
    if (editingItem) {
      setInventory(inventory.map(i => i.id === editingItem.id ? { 
        ...i, 
        ...formData, 
        stock: parseInt(formData.stock), 
        threshold: parseInt(formData.threshold) 
      } : i));
      toast.success('Item updated!');
    } else {
      setInventory([...inventory, { 
        id: inventory.length + 1, 
        ...formData, 
        stock: parseInt(formData.stock), 
        threshold: parseInt(formData.threshold), 
        lastRestocked: new Date().toISOString().split('T')[0] 
      }]);
      toast.success('Item added!');
    }
    setShowModal(false);
    setEditingItem(null);
    setFormData({ item: '', stock: '', threshold: 20, unit: 'pieces', category: 'Supplies' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this item?')) {
      setInventory(inventory.filter(i => i.id !== id));
      toast.success('Item deleted');
    }
  };

  const handleRestock = () => {
    if (!restockQuantity || restockQuantity <= 0) { 
      toast.error('Enter valid quantity'); 
      return; 
    }
    setInventory(inventory.map(i => i.id === selectedItem.id ? { 
      ...i, 
      stock: i.stock + parseInt(restockQuantity), 
      lastRestocked: new Date().toISOString().split('T')[0] 
    } : i));
    setShowRestockModal(false);
    setRestockQuantity('');
    setSelectedItem(null);
    toast.success(`Added ${restockQuantity} ${selectedItem?.unit} to ${selectedItem?.item}`);
  };

  const filteredInventory = inventory.filter(i => 
    i.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (item) => {
    if (item.stock <= 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: '🔴' };
    if (item.stock <= item.threshold) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-700', icon: '✅' };
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Food': return;
      case 'Beverage': return;
      case 'Supplies': return;
      default: return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Track stock levels and manage inventory</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-600">
          <p className="text-gray-500 text-sm">Total Items in Stock</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-600">
          <p className="text-gray-500 text-sm">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-600">
          <p className="text-gray-500 text-sm">Total Categories</p>
          <p className="text-2xl font-bold">{new Set(inventory.map(i => i.category)).size}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-600">
          <p className="text-gray-500 text-sm">Estimated Value</p>
          <p className="text-2xl font-bold">₱{totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search inventory by name or category..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Restocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <span className="font-medium text-gray-800">{item.item}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {item.stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.threshold} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <span>{status.icon}</span> {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} /> {item.lastRestocked}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { 
                            setSelectedItem(item); 
                            setShowRestockModal(true); 
                          }} 
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                        >
                          Restock
                        </button>
                        <button 
                          onClick={() => { 
                            setEditingItem(item); 
                            setFormData(item); 
                            setShowModal(true); 
                          }} 
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button 
                onClick={() => { 
                  setShowModal(false); 
                  setEditingItem(null); 
                  setFormData({ item: '', stock: '', threshold: 20, unit: 'pieces', category: 'Supplies' });
                }} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={formData.item} 
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                >
                  <option>Food</option>
                  <option>Beverage</option>
                  <option>Supplies</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input 
                  type="number" 
                  value={formData.stock} 
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
                  placeholder="Enter stock quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input 
                  type="text" 
                  value={formData.unit} 
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
                  placeholder="pieces, kg, sets"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input 
                  type="number" 
                  value={formData.threshold} 
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
                />
              </div>
              <button 
                onClick={handleSubmit} 
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                {editingItem ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Restock {selectedItem.item}</h3>
              <button 
                onClick={() => { 
                  setShowRestockModal(false); 
                  setSelectedItem(null); 
                  setRestockQuantity('');
                }} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock: <span className="font-bold">{selectedItem.stock} {selectedItem.unit}</span>
                </label>
                <input 
                  type="number" 
                  value={restockQuantity} 
                  onChange={(e) => setRestockQuantity(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500" 
                  placeholder="Quantity to add"
                />
              </div>
              <button 
                onClick={handleRestock} 
                className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}