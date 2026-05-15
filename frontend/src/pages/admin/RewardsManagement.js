import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { rewardsAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

export default function RewardsManagement() {
  const [rewards, setRewards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    pointsRequired: '', 
    category: 'snacks', 
    description: '' 
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const response = await rewardsAPI.getAll();
      if (response.data.success) {
        setRewards(response.data.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.pointsRequired) {
      toast.error('Please fill required fields');
      return;
    }
    
    try {
      if (editingReward) {
        const response = await rewardsAPI.update(editingReward._id, {
          name: formData.name,
          pointsRequired: parseInt(formData.pointsRequired),
          category: formData.category,
          description: formData.description
        });
        if (response.data.success) {
          toast.success('Reward updated!');
        }
      } else {
        const response = await rewardsAPI.create({
          name: formData.name,
          pointsRequired: parseInt(formData.pointsRequired),
          category: formData.category,
          description: formData.description
        });
        if (response.data.success) {
          toast.success('Reward added!');
        }
      }
      setShowModal(false);
      setEditingReward(null);
      setFormData({ name: '', pointsRequired: '', category: 'snacks', description: '' });
      fetchRewards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this reward?')) {
      try {
        const response = await rewardsAPI.delete(id);
        if (response.data.success) {
          toast.success('Reward deleted');
          fetchRewards();
        }
      } catch (error) {
        toast.error('Failed to delete reward');
      }
    }
  };

  const filteredRewards = rewards.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rewards Management</h1>
          <p className="text-gray-500 mt-1">Manage student rewards and points</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700">
          <Plus size={18} /> Add Reward
        </button>
      </div>
      
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search rewards..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl" 
        />
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRewards.map((r) => (
              <tr key={r._id}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{r.pointsRequired} pts</span>
                </td>
                <td className="px-6 py-4">{r.stock || 0}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{r.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { 
                      setEditingReward(r); 
                      setFormData({ 
                        name: r.name, 
                        pointsRequired: r.pointsRequired, 
                        category: r.category,
                        description: r.description || ''
                      }); 
                      setShowModal(true); 
                    }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(r._id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingReward ? 'Edit Reward' : 'Add Reward'}</h3>
              <button onClick={() => { setShowModal(false); setEditingReward(null); }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reward Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points Required</label>
                <input type="number" value={formData.pointsRequired} onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-xl">
                  <option value="snacks">Snacks</option>
                  <option value="drinks">Drinks</option>
                  <option value="school_supplies">School Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-xl" rows="3" />
              </div>
              <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700">
                {editingReward ? 'Save Changes' : 'Add Reward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}