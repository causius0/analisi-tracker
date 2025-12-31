'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import LabChart from './LabChart';
import ValueSelector from './ValueSelector';
import ComparisonChart from './ComparisonChart';
import DataEntryForm from './DataEntryForm';
import PDFUpload from './PDFUpload';

interface LabValue {
  value: number | null;
  unit: string;
  range: {
    min: number;
    max: number;
  };
  note?: string;
}

interface LabTest {
  date: string;
  source: string;
  values: Record<string, LabValue>;
}

interface LabData {
  patient: {
    name: string;
    dateOfBirth: string;
    gender: string;
  };
  labTests: LabTest[];
}

const STORAGE_KEY = 'lab-values-custom-data';

export default function LabDashboard() {
  const [labData, setLabData] = useState<LabData | null>(null);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [comparisonValues, setComparisonValues] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'individual' | 'comparison'>('individual');
  const [loading, setLoading] = useState(true);

  // Load data from JSON and localStorage
  useEffect(() => {
    fetch('/lab-data.json')
      .then((res) => res.json())
      .then((data: LabData) => {
        // Load custom data from localStorage
        const customDataStr = localStorage.getItem(STORAGE_KEY);
        if (customDataStr) {
          try {
            const customData = JSON.parse(customDataStr);
            // Merge custom data with loaded data
            data.labTests = [...data.labTests, ...customData];
            // Sort by date
            data.labTests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          } catch (e) {
            console.error('Error loading custom data:', e);
          }
        }

        setLabData(data);
        // Pre-select some common values
        const commonValues = ['Creatininemia', 'Emoglobina', 'Potassiemia', 'Calcemia'];
        const availableValues = new Set<string>();
        data.labTests.forEach((test) => {
          Object.keys(test.values).forEach((key) => availableValues.add(key));
        });
        const initialSelection = commonValues.filter((v) => availableValues.has(v));
        setSelectedValues(initialSelection.length > 0 ? initialSelection : Array.from(availableValues).slice(0, 4));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading lab data:', error);
        setLoading(false);
      });
  }, []);

  const allValueNames = useMemo(() => {
    if (!labData) return [];
    const names = new Set<string>();
    labData.labTests.forEach((test) => {
      Object.keys(test.values).forEach((key) => names.add(key));
    });
    return Array.from(names).sort();
  }, [labData]);

  const handleValueToggle = (valueName: string) => {
    if (viewMode === 'comparison') {
      setComparisonValues((prev) => {
        if (prev.includes(valueName)) {
          return prev.filter((v) => v !== valueName);
        } else {
          return [...prev, valueName];
        }
      });
    } else {
      setSelectedValues((prev) => {
        if (prev.includes(valueName)) {
          return prev.filter((v) => v !== valueName);
        } else {
          return [...prev, valueName];
        }
      });
    }
  };

  const handleSelectAll = () => {
    if (viewMode === 'comparison') {
      setComparisonValues(allValueNames);
    } else {
      setSelectedValues(allValueNames);
    }
  };

  const handleClearAll = () => {
    if (viewMode === 'comparison') {
      setComparisonValues([]);
    } else {
      setSelectedValues([]);
    }
  };

  const handleAddData = (date: string, valueName: string, value: number) => {
    if (!labData) return;

    // Get the reference data for this value name to extract unit and range
    let referenceValue: LabValue | undefined;
    for (const test of labData.labTests) {
      if (test.values[valueName]) {
        referenceValue = test.values[valueName];
        break;
      }
    }

    if (!referenceValue) {
      alert('Could not find reference data for this value. Please ensure the value name is correct.');
      return;
    }

    // Find or create test for this date
    const existingTestIndex = labData.labTests.findIndex((test) => test.date === date);

    if (existingTestIndex >= 0) {
      // Add to existing test
      labData.labTests[existingTestIndex].values[valueName] = {
        value,
        unit: referenceValue.unit,
        range: referenceValue.range,
        note: 'Manually added',
      };
    } else {
      // Create new test
      const newTest: LabTest = {
        date,
        source: 'Manual Entry',
        values: {
          [valueName]: {
            value,
            unit: referenceValue.unit,
            range: referenceValue.range,
            note: 'Manually added',
          },
        },
      };
      labData.labTests.push(newTest);
    }

    // Sort by date
    labData.labTests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Save custom data to localStorage (only manually added tests)
    const customTests = labData.labTests.filter((test) => test.source === 'Manual Entry');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTests));

    // Update state
    setLabData({ ...labData });
  };

  const handlePDFUpload = (file: File) => {
    console.log('PDF uploaded:', file.name);
    // Store reference to uploaded PDF
    // For now, just log it - actual extraction would require server-side processing
  };

  const handleRemoveFromComparison = (valueName: string) => {
    setComparisonValues((prev) => prev.filter((v) => v !== valueName));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading lab data...</div>
      </div>
    );
  }

  if (!labData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Error loading lab data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Patient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
          <div>
            <span className="font-medium">Name:</span> {labData.patient.name}
          </div>
          <div>
            <span className="font-medium">Date of Birth:</span>{' '}
            {format(new Date(labData.patient.dateOfBirth), 'dd/MM/yyyy')}
          </div>
          <div>
            <span className="font-medium">Gender:</span> {labData.patient.gender}
          </div>
        </div>
      </div>

      <DataEntryForm allValueNames={allValueNames} onAddData={handleAddData} />

      <PDFUpload onPDFUploaded={handlePDFUpload} />

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">View Mode</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('individual')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              viewMode === 'individual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Individual Charts
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              viewMode === 'comparison'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📈 Comparison Chart
          </button>
        </div>
        {viewMode === 'comparison' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Comparison Mode:</strong> Select multiple values to compare them on the same chart.
            </p>
          </div>
        )}
      </div>

      <ValueSelector
        allValues={allValueNames}
        selectedValues={viewMode === 'comparison' ? comparisonValues : selectedValues}
        onValueToggle={handleValueToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      <div className="space-y-6">
        {viewMode === 'individual' ? (
          <>
            {selectedValues.map((valueName) => (
              <LabChart key={valueName} labData={labData} valueName={valueName} />
            ))}
            {selectedValues.length === 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-700">
                  Please select at least one lab value to display charts.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {comparisonValues.length > 0 ? (
              <ComparisonChart
                labData={labData}
                valueNames={comparisonValues}
                onRemoveValue={handleRemoveFromComparison}
              />
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-yellow-700">
                  Please select at least two lab values to compare on the chart.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
