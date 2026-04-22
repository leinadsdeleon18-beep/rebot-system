import React, { useState } from 'react';
import { 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Package,
  Weight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock scheduled pickups
const mockScheduledPickups = [
  { id: 1, date: '2026-04-05', material: 'PET Bottles', quantity: '1,500 pcs', estimatedWeight: '60 kg', status: 'scheduled', location: 'Main Bin Area' },
  { id: 2, date: '2026-04-06', material: 'Paper', quantity: '300 kg', estimatedWeight: '300 kg', status: 'scheduled', location: 'Paper Bin' }
];

const mockCompletedPickups = [
  { id: 3, date: '2026-04-03', material: 'PET Bottles', quantity: '1,200 pcs', weight: '48 kg', completedBy: 'Juan Reyes', time: '02:30 PM' },
  { id: 4, date: '2026-04-02', material: '1.5L Bottles', quantity: '750 pcs', weight: '30 kg', completedBy: 'Juan Reyes', time: '10:00 AM' }
];

const materials = [
  { value: 'pet_bottles', label: 'PET Bottles', unit: 'pieces' },
  { value: 'large_bottles', label: '1.5L Bottles', unit: 'pieces' },
  { value: 'paper', label: 'Paper Modules', unit: 'kg' }
];

export default function PickupScheduler() {
  const [scheduledPickups, setScheduledPickups] = useState(mockScheduledPickups);
  const [completedPickups] = useState(mockCompletedPickups);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState('pet_bottles');
  const [pickupDate, setPickupDate] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSchedulePickup = () => {
    if (!pickupDate || !estimatedQuantity) {
      toast.error('Please fill all required fields');
      return;
    }

    const material = materials.find(m => m.value === selectedMaterial);
    const newPickup = {
      id: scheduledPickups.length + 1,
      date: pickupDate,
      material: material.label,
      quantity: `${parseInt(estimatedQuantity).toLocaleString()} ${material.unit}`,
      estimatedWeight: material.unit === 'kg' ? `${estimatedQuantity} kg` : `${Math.round(estimatedQuantity * 0.04)} kg`,
      status: 'scheduled',
      location: 'Main Bin Area'
    };

    setScheduledPickups([...scheduledPickups, newPickup]);
    setShowScheduleModal(false);
    setPickupDate('');
    setEstimatedQuantity('');
    setNotes('');
    toast.success('Pickup scheduled successfully!');
  };

  const handleCompletePickup = (pickup) => {
    toast.success(`Pickup for ${pickup.material} completed!`);
    setScheduledPickups(scheduledPickups.filter(p => p.id !== pickup.id));
  };

  const handleCancelPickup = (id) => {
    if (window.confirm('Cancel this scheduled pickup?')) {
      setScheduledPickups(scheduledPickups.filter(p => p.id !== id));
      toast.success('Pickup cancelled');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pickup Scheduler</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Schedule and manage recyclable material pickups</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-5 py-2 bg-green-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
        >
          <Plus size={18} /> Schedule Pickup
        </button>
      </div>

      {/* Scheduled Pickups */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Clock size={20} /> Scheduled Pickups
          </h3>
        </div>
        {scheduledPickups.length === 0 ? (
          <div className="p-8 text-center">
            <Truck size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No scheduled pickups</p>
            <button onClick={() => setShowScheduleModal(true)} className="mt-2 text-green-600 hover:underline">Schedule a pickup</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {scheduledPickups.map((pickup) => (
              <div key={pickup.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <Calendar size={18} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{pickup.material}</p>
                      <p className="text-sm text-gray-500">Date: {pickup.date}</p>
                      <p className="text-sm text-gray-500">Quantity: {pickup.quantity} | Est. Weight: {pickup.estimatedWeight}</p>
                      <p className="text-xs text-gray-400 mt-1"><MapPin size={12} className="inline mr-1" /> {pickup.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCompletePickup(pickup)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                    >
                      <CheckCircle size={16} /> Complete
                    </button>
                    <button
                      onClick={() => handleCancelPickup(pickup.id)}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Pickups History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <CheckCircle size={20} /> Completed Pickups
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {completedPickups.map((pickup) => (
            <div key={pickup.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{pickup.material}</p>
                    <p className="text-sm text-gray-500">Date: {pickup.date} at {pickup.time}</p>
                    <p className="text-sm text-gray-500">Quantity: {pickup.quantity} | Weight: {pickup.weight}</p>
                    <p className="text-xs text-gray-400 mt-1"><User size={12} className="inline mr-1" /> Collected by: {pickup.completedBy}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
                  Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Pickup Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Schedule Pickup</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Type</label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                >
                  {materials.map(m => (
                    <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Quantity</label>
                <input
                  type="number"
                  value={estimatedQuantity}
                  onChange={(e) => setEstimatedQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                  placeholder="Enter quantity"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedMaterial === 'paper' ? 'Quantity in kilograms' : 'Number of bottles'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                  placeholder="Additional instructions..."
                />
              </div>
              <button
                onClick={handleSchedulePickup}
                className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Schedule Pickup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}