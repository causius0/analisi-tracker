import { faker } from '@faker-js/faker';

export interface LabResult {
  id?: string;
  patientId: string;
  testName: string;
  date: string;
  results: Record<string, { value: number; unit: string; referenceRange: string; flag?: string }>;
  notes?: string;
  facility?: string;
  createdAt?: string;
}

const commonLabTests = [
  'Complete Blood Count',
  'Lipid Panel',
  'Comprehensive Metabolic Panel',
  'Thyroid Panel',
  'Hemoglobin A1C',
  'Vitamin D',
  'Iron Panel',
  'Liver Function Tests',
  'Kidney Function Tests',
];

const labTestFields = {
  'Complete Blood Count': {
    hemoglobin: { unit: 'g/dL', range: [13.5, 17.5] },
    hematocrit: { unit: '%', range: [38, 50] },
    wbc: { unit: 'x10^9/L', range: [4.5, 11.0] },
    rbc: { unit: 'x10^12/L', range: [4.5, 5.5] },
    platelets: { unit: 'x10^9/L', range: [150, 400] },
  },
  'Lipid Panel': {
    totalCholesterol: { unit: 'mg/dL', range: [100, 200] },
    ldl: { unit: 'mg/dL', range: [50, 100] },
    hdl: { unit: 'mg/dL', range: [40, 60] },
    triglycerides: { unit: 'mg/dL', range: [50, 150] },
  },
  'Comprehensive Metabolic Panel': {
    glucose: { unit: 'mg/dL', range: [70, 100] },
    creatinine: { unit: 'mg/dL', range: [0.7, 1.3] },
    sodium: { unit: 'mmol/L', range: [135, 145] },
    potassium: { unit: 'mmol/L', range: [3.5, 5.0] },
    calcium: { unit: 'mg/dL', range: [8.5, 10.2] },
  },
  'Thyroid Panel': {
    tsh: { unit: 'mIU/L', range: [0.4, 4.0] },
    t3: { unit: 'ng/dL', range: [100, 200] },
    t4: { unit: 'mcg/dL', range: [4.5, 12.0] },
  },
  'Hemoglobin A1C': {
    a1c: { unit: '%', range: [4.0, 5.6] },
  },
  'Vitamin D': {
    vitaminD: { unit: 'ng/mL', range: [30, 100] },
  },
  'Iron Panel': {
    iron: { unit: 'mcg/dL', range: [50, 170] },
    ferritin: { unit: 'ng/mL', range: [11, 307] },
    transferrin: { unit: 'mcg/dL', range: [200, 360] },
  },
};

export const labResultFactory = (overrides: Partial<LabResult> = {}): LabResult => {
  const testName = faker.helpers.arrayElement(commonLabTests);
  const testFields = labTestFields[testName as keyof typeof labTestFields];

  const results: Record<string, { value: number; unit: string; referenceRange: string; flag?: string }> = {};

  if (testFields) {
    Object.entries(testFields).forEach(([fieldName, field]) => {
      const value = faker.number.float({
        min: field.range[0] * 0.8,
        max: field.range[1] * 1.2,
        precision: 0.1,
      });

      let flag: string | undefined;
      if (value < field.range[0]) flag = 'L';
      if (value > field.range[1]) flag = 'H';

      results[fieldName] = {
        value,
        unit: field.unit,
        referenceRange: `${field.range[0]}-${field.range[1]}`,
        flag,
      };
    });
  }

  return {
    id: faker.string.uuid(),
    patientId: faker.string.uuid(),
    testName,
    date: faker.date.past().toISOString().split('T')[0],
    results,
    notes: faker.helpers.arrayElement([undefined, faker.lorem.sentence()]),
    facility: faker.company.name(),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
};

export const createMultipleLabResults = (count: number, overrides: Partial<LabResult> = {}): LabResult[] => {
  return Array.from({ length: count }, () => labResultFactory(overrides));
};

export const createLabResultsForPatient = (
  patientId: string,
  count: number = 5,
  testName?: string,
  startDate?: Date
): LabResult[] => {
  const results: LabResult[] = [];
  const date = startDate || faker.date.past({ years: 1 });

  for (let i = 0; i < count; i++) {
    const testDate = new Date(date);
    testDate.setDate(testDate.getDate() + (i * 30)); // One month apart

    results.push(
      labResultFactory({
        patientId,
        testName,
        date: testDate.toISOString().split('T')[0],
      })
    );
  }

  return results;
};
