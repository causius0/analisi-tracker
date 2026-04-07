/**
 * ChartGrid Component
 * Displays a grid of charts for different lab tests
 */

'use client';

import { IndividualLabChart } from './IndividualLabChart';
import { DataPoint } from '../../types/charts';

interface ChartGridProps {
  labTests?: Array<{
    id: string;
    name: string;
    data: DataPoint[];
    unit: string;
    referenceRange?: { min: number; max: number } | undefined;
  }>;
}

export function ChartGrid({ labTests }: ChartGridProps) {
  // Default mock data if no lab tests provided
  const defaultLabTests: ChartGridProps['labTests'] = [
    {
      id: 'cbc',
      name: 'Complete Blood Count',
      data: [] as DataPoint[],
      unit: 'g/dL',
      referenceRange: undefined,
    },
    {
      id: 'metabolic',
      name: 'Metabolic Panel',
      data: [] as DataPoint[],
      unit: 'mg/dL',
      referenceRange: undefined,
    },
    {
      id: 'lipid',
      name: 'Lipid Panel',
      data: [] as DataPoint[],
      unit: 'mg/dL',
      referenceRange: undefined,
    },
    {
      id: 'thyroid',
      name: 'Thyroid Panel',
      data: [] as DataPoint[],
      unit: 'mIU/L',
      referenceRange: undefined,
    },
  ];

  const testsToDisplay = labTests || defaultLabTests;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {testsToDisplay.map((test) => (
        <div key={test.id} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">{test.name}</h3>
          <IndividualLabChart
            data={test.data}
            labTestName={test.name}
            unit={test.unit}
            referenceRange={test.referenceRange}
          />
        </div>
      ))}
    </div>
  );
}

export default ChartGrid;
