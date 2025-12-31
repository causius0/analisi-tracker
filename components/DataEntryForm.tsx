'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface DataEntryFormProps {
  allValueNames: string[];
  onAddData: (date: string, valueName: string, value: number) => void;
}

export default function DataEntryForm({ allValueNames, onAddData }: DataEntryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedValue, setSelectedValue] = useState('');
  const [enteredValue, setEnteredValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredValues = allValueNames.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedValue || !enteredValue || !selectedDate) {
      alert('Please fill in all fields');
      return;
    }

    const numValue = parseFloat(enteredValue);
    if (isNaN(numValue)) {
      alert('Please enter a valid number');
      return;
    }

    onAddData(selectedDate, selectedValue, numValue);

    // Reset form
    setEnteredValue('');
    alert('Data added successfully!');
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
        >
          + Add New Lab Value Manually
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Add New Lab Value</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Value Name
          </label>
          <input
            type="text"
            placeholder="Search for lab value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
          />
          <select
            value={selectedValue}
            onChange={(e) => {
              setSelectedValue(e.target.value);
              setSearchTerm('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a lab value...</option>
            {filteredValues.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <input
            type="number"
            step="0.01"
            value={enteredValue}
            onChange={(e) => setEnteredValue(e.target.value)}
            placeholder="Enter the measured value"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Add Value
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> You can add multiple values for the same date. The chart will update automatically.
        </p>
      </div>
    </div>
  );
}
