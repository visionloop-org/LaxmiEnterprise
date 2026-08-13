import React, { useState } from 'react';

export default function ArrivedTimeModal({ isOpen, employee, onClose, onConfirm }) {
  if (!isOpen || !employee) return null;

  const getCurrentTimeString = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // "HH:MM"
  };

  const [selectedTime, setSelectedTime] = useState(getCurrentTimeString());
  const [remarks, setRemarks] = useState('');

  const quickTimes = [
    { label: 'Now', time: getCurrentTimeString() },
    { label: '08:00 AM', time: '08:00' },
    { label: '08:30 AM', time: '08:30' },
    { label: '09:00 AM', time: '09:00' },
    { label: '09:30 AM', time: '09:30' },
    { label: '10:00 AM', time: '10:00' },
  ];

  const handleConfirm = () => {
    const today = new Date().toISOString().split('T')[0];
    const fullIsoTime = `${today}T${selectedTime}:00.000Z`;
    onConfirm({
      employeeId: employee.id || employee.employeeId,
      arrivalTime: fullIsoTime,
      remarks: remarks || `Arrived at ${selectedTime}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/60 text-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Set Arrival Time</h3>
            <p className="text-xs text-slate-400 font-medium">
              Employee: <span className="text-amber-400 font-semibold">{employee.name}</span> ({employee.employeeId || employee.id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Time Select
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickTimes.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSelectedTime(preset.time)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all border ${
                  selectedTime === preset.time
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Custom Time (HH:MM)
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-center text-lg focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Remarks (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Traffic delay, permission approved..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-xl shadow-lg shadow-amber-400/20"
          >
            Confirm Arrival
          </button>
        </div>
      </div>
    </div>
  );
}
