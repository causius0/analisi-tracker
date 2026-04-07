import React, { useState, useEffect } from 'react';
import { Users, User, ChevronDown, Check } from 'lucide-react';

/**
 * PatientSelector Component
 *
 * Allows switching between different patients in multi-patient view
 */
const PatientSelector = ({ patients, selectedPatient, onSelectPatient }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = Object.values(patients || {}).filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPatient = selectedPatient
    ? Object.values(patients || {}).find(p => p.id === selectedPatient)
    : null;

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handlePatientSelect = (patientId) => {
    onSelectPatient(patientId);
    setIsOpen(false);
  };

  const getPatientStats = (patient) => {
    const labResultsCount = patient.labResults?.length || 0;
    const totalTests = patient.labResults?.reduce(
      (sum, result) => sum + (result.labTests?.length || 0),
      0
    );
    return { labResultsCount, totalTests };
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Patient Selection
      </label>

      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center space-x-3">
          {currentPatient ? (
            <>
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">
                  {currentPatient.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {getPatientStats(currentPatient).labResultsCount} lab results
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
              <Users className="w-5 h-5" />
              <span>Select a patient</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Patient List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No patients found
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const stats = getPatientStats(patient);
                const isSelected = patient.id === selectedPatient;

                return (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {patient.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {stats.labResultsCount} lab results • {stats.totalTests} tests
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSelector;
