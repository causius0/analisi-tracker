'use client';

import { useState } from 'react';

interface ValueSelectorProps {
  allValues: string[];
  selectedValues: string[];
  onValueToggle: (valueName: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function ValueSelector({
  allValues,
  selectedValues,
  onValueToggle,
  onSelectAll,
  onClearAll,
}: ValueSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredValues = allValues.filter((value) =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = selectedValues.length;
  const totalCount = allValues.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Select Lab Values
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selectedCount} of {totalCount} selected)
          </span>
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isExpanded ? 'Hide' : 'Show'} Selector
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search lab values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={onSelectAll}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={onClearAll}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {filteredValues.map((valueName) => {
              const isSelected = selectedValues.includes(valueName);
              return (
                <label
                  key={valueName}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onValueToggle(valueName)}
                    className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                    {valueName}
                  </span>
                </label>
              );
            })}
          </div>

          {filteredValues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No lab values match your search.
            </div>
          )}
        </>
      )}
    </div>
  );
}
