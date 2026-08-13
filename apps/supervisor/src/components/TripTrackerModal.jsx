import React, { useState } from 'react';
import { useTrips, useCreateTrip, useUpdateTripStatus, useVehicles, useEmployees } from '@laxmi/shared';

export default function TripTrackerModal({ isOpen, onClose, sessionId }) {
  if (!isOpen) return null;

  const { data: trips = [], isLoading } = useTrips({ sessionId });
  const { data: vehicles = [] } = useVehicles();
  const { data: employees = [] } = useEmployees();

  const createTripMutation = useCreateTrip();
  const updateStatusMutation = useUpdateTripStatus();

  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'

  // New Trip Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [destination, setDestination] = useState('');
  const [productDetails, setProductDetails] = useState('Aggregates / Materials');
  const [remarks, setRemarks] = useState('');

  const drivers = employees.filter(e => e.category === 'Driver' || e.category === 'Drivers');

  const handleCreateTrip = (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !destination) return;

    const vehicleObj = vehicles.find(v => (v.id || v._id) === selectedVehicleId || v.vehicleNumber === selectedVehicleId);
    const driverObj = employees.find(e => (e.id || e._id) === driverId || e.employeeId === driverId);

    createTripMutation.mutate({
      sessionId: sessionId || 'SES-CURRENT',
      vehicleId: selectedVehicleId,
      vehicleNumber: vehicleObj ? vehicleObj.vehicleNumber : selectedVehicleId,
      driverEmployeeId: driverObj ? driverObj.employeeId || driverObj.id : undefined,
      driverName: driverObj ? driverObj.name : undefined,
      destinationLocation: destination,
      productDetails: productDetails,
      status: 'dispatched',
      remarks: remarks || 'Dispatched from quarry/yard'
    }, {
      onSuccess: () => {
        setActiveTab('list');
        setSelectedVehicleId('');
        setDestination('');
        setRemarks('');
      }
    });
  };

  const handleStatusUpdate = (tripId, nextStatus) => {
    updateStatusMutation.mutate({
      tripId,
      status: nextStatus,
      remarks: `Updated to ${nextStatus.replace('_', ' ')}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>🚛 Vehicle Trip & Delivery Lifecycle</span>
            </h2>
            <p className="text-xs text-slate-400">Track dispatch, site arrival, material delivery & vehicle returns</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600/30 border border-blue-500 text-blue-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active & Past Trips ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'new'
                ? 'bg-blue-600/30 border border-blue-500 text-blue-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ➕ Dispatch New Trip
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'list' ? (
            isLoading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Loading trips...</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-10 bg-slate-800/40 rounded-xl border border-slate-800">
                <p className="text-sm font-semibold text-slate-300">No active trips dispatched yet.</p>
                <p className="text-xs text-slate-500 mt-1">Click "Dispatch New Trip" to start tracking a delivery.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map(trip => {
                  const tripId = trip.id || trip._id;
                  return (
                    <div key={tripId} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400 text-sm">{trip.vehicleNumber}</span>
                            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                              trip.status === 'dispatched' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              trip.status === 'reached_location' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              trip.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {trip.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium mt-1">
                            Destination: <span className="text-slate-100 font-semibold">{trip.destinationLocation}</span>
                          </p>
                          {trip.driverName && (
                            <p className="text-[11px] text-slate-400 mt-0.5">Driver: {trip.driverName}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(trip.dispatchedAt || trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Status Transition Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                        {trip.status === 'dispatched' && (
                          <button
                            onClick={() => handleStatusUpdate(tripId, 'reached_location')}
                            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-semibold transition-all"
                          >
                            📍 Location Reached
                          </button>
                        )}
                        {(trip.status === 'dispatched' || trip.status === 'reached_location') && (
                          <button
                            onClick={() => handleStatusUpdate(tripId, 'delivered')}
                            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-all"
                          >
                            📦 Product Delivered
                          </button>
                        )}
                        {trip.status !== 'returned' && (
                          <button
                            onClick={() => handleStatusUpdate(tripId, 'returned')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-all"
                          >
                            🔄 Returned to Yard
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id || v._id || v.vehicleNumber} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.vehicleType} - {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Optional Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id || d._id || d.employeeId} value={d.employeeId || d.id}>
                      {d.name} ({d.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination / Delivery Location</label>
                <input
                  type="text"
                  placeholder="e.g. Site B Highway Kilometre 42"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product / Load Details</label>
                <input
                  type="text"
                  value={productDetails}
                  onChange={(e) => setProductDetails(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Chalan / Order notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTripMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
                >
                  {createTripMutation.isPending ? 'Dispatching...' : 'Dispatch Trip'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
