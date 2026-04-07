/**
 * Database Seed Script
 * Populates database with initial data for development
 */

import { db, users, patients, labTestDefinitions, labTestResults } from '../index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed lab test definitions
 */
async function seedLabTestDefinitions() {
  console.log('Seeding lab test definitions...');

  const definitions = [
    // Kidney Function
    {
      id: uuidv4(),
      name: 'Creatinine',
      category: 'kidney',
      unit: 'mg/dL',
      referenceMin: '0.7',
      referenceMax: '1.3',
      description: 'Measures kidney function by filtering creatinine from blood',
      clinicalInfo: 'High levels may indicate kidney problems or dehydration'
    },
    {
      id: uuidv4(),
      name: 'eGFR',
      category: 'kidney',
      unit: 'mL/min/1.73m²',
      referenceMin: '90',
      referenceMax: '120',
      description: 'Estimated Glomerular Filtration Rate',
      clinicalInfo: 'Measures how well kidneys filter waste from blood'
    },
    {
      id: uuidv4(),
      name: 'BUN',
      category: 'kidney',
      unit: 'mg/dL',
      referenceMin: '7',
      referenceMax: '20',
      description: 'Blood Urea Nitrogen',
      clinicalInfo: 'High levels may indicate kidney dysfunction or dehydration'
    },

    // Liver Function
    {
      id: uuidv4(),
      name: 'ALT',
      category: 'liver',
      unit: 'U/L',
      referenceMin: '7',
      referenceMax: '56',
      description: 'Alanine Aminotransferase',
      clinicalInfo: 'High levels may indicate liver damage'
    },
    {
      id: uuidv4(),
      name: 'AST',
      category: 'liver',
      unit: 'U/L',
      referenceMin: '10',
      referenceMax: '40',
      description: 'Aspartate Aminotransferase',
      clinicalInfo: 'Elevated levels may indicate liver or muscle damage'
    },

    // Metabolic
    {
      id: uuidv4(),
      name: 'Glucose',
      category: 'metabolic',
      unit: 'mg/dL',
      referenceMin: '70',
      referenceMax: '100',
      description: 'Blood glucose level',
      clinicalInfo: 'High levels may indicate diabetes or prediabetes'
    },
    {
      id: uuidv4(),
      name: 'HbA1c',
      category: 'metabolic',
      unit: '%',
      referenceMin: '4.0',
      referenceMax: '5.7',
      description: 'Hemoglobin A1c',
      clinicalInfo: 'Measures average blood sugar over 2-3 months'
    },
    {
      id: uuidv4(),
      name: 'Cholesterol',
      category: 'metabolic',
      unit: 'mg/dL',
      referenceMin: '0',
      referenceMax: '200',
      description: 'Total cholesterol',
      clinicalInfo: 'High levels increase heart disease risk'
    },
    {
      id: uuidv4(),
      name: 'LDL',
      category: 'metabolic',
      unit: 'mg/dL',
      referenceMin: '0',
      referenceMax: '100',
      description: 'Low-Density Lipoprotein (bad cholesterol)',
      clinicalInfo: 'High levels increase heart disease risk'
    },
    {
      id: uuidv4(),
      name: 'HDL',
      category: 'metabolic',
      unit: 'mg/dL',
      referenceMin: '40',
      referenceMax: '60',
      description: 'High-Density Lipoprotein (good cholesterol)',
      clinicalInfo: 'Higher levels are protective against heart disease'
    },

    // Thyroid
    {
      id: uuidv4(),
      name: 'TSH',
      category: 'thyroid',
      unit: 'mIU/L',
      referenceMin: '0.4',
      referenceMax: '4.0',
      description: 'Thyroid Stimulating Hormone',
      clinicalInfo: 'Abnormal levels may indicate thyroid problems'
    },
    {
      id: uuidv4(),
      name: 'Free T4',
      category: 'thyroid',
      unit: 'ng/dL',
      referenceMin: '0.8',
      referenceMax: '1.8',
      description: 'Free Thyroxine',
      clinicalInfo: 'Measures active thyroid hormone level'
    },

    // Complete Blood Count
    {
      id: uuidv4(),
      name: 'Hemoglobin',
      category: 'cbc',
      unit: 'g/dL',
      referenceMin: '12.0',
      referenceMax: '16.0',
      description: 'Hemoglobin level',
      clinicalInfo: 'Low levels may indicate anemia'
    },
    {
      id: uuidv4(),
      name: 'WBC',
      category: 'cbc',
      unit: 'cells/μL',
      referenceMin: '4500',
      referenceMax: '11000',
      description: 'White Blood Cell count',
      clinicalInfo: 'Abnormal levels may indicate infection or immune disorders'
    },
    {
      id: uuidv4(),
      name: 'Platelets',
      category: 'cbc',
      unit: 'cells/μL',
      referenceMin: '150000',
      referenceMax: '450000',
      description: 'Platelet count',
      clinicalInfo: 'Low levels may increase bleeding risk'
    },

    // Electrolytes
    {
      id: uuidv4(),
      name: 'Sodium',
      category: 'electrolyte',
      unit: 'mmol/L',
      referenceMin: '135',
      referenceMax: '145',
      description: 'Blood sodium level',
      clinicalInfo: 'Abnormal levels may indicate dehydration or kidney problems'
    },
    {
      id: uuidv4(),
      name: 'Potassium',
      category: 'electrolyte',
      unit: 'mmol/L',
      referenceMin: '3.5',
      referenceMax: '5.0',
      description: 'Blood potassium level',
      clinicalInfo: 'Abnormal levels can affect heart rhythm'
    }
  ];

  await db.insert(labTestDefinitions).values(definitions);
  console.log(`✓ Seeded ${definitions.length} lab test definitions`);
}

/**
 * Seed test users
 */
async function seedUsers() {
  console.log('Seeding test users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const testUsers = [
    {
      id: uuidv4(),
      email: 'test@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
      emailVerified: true
    },
    {
      id: uuidv4(),
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true
    },
    {
      id: uuidv4(),
      email: 'clinician@example.com',
      passwordHash,
      firstName: 'Dr.',
      lastName: 'Smith',
      role: 'clinician',
      isActive: true,
      emailVerified: true
    }
  ];

  await db.insert(users).values(testUsers);
  console.log(`✓ Seeded ${testUsers.length} test users`);
  console.log('  Email: test@example.com, Password: password123');
  console.log('  Email: admin@example.com, Password: password123');
  console.log('  Email: clinician@example.com, Password: password123');

  return testUsers;
}

/**
 * Seed test patients
 */
async function seedPatients(userId) {
  console.log('Seeding test patients...');

  const testPatients = [
    {
      id: uuidv4(),
      userId,
      name: 'John Doe',
      dateOfBirth: new Date('1980-05-15'),
      sex: 'male',
      bloodType: 'O+',
      allergies: [
        { name: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' }
      ],
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' }
      ],
      conditions: ['Hypertension', 'Stage 3 CKD'],
      isPrimary: true
    },
    {
      id: uuidv4(),
      userId,
      name: 'Jane Doe',
      dateOfBirth: new Date('1985-08-22'),
      sex: 'female',
      bloodType: 'A+',
      allergies: [],
      medications: [],
      conditions: [],
      isPrimary: false
    }
  ];

  await db.insert(patients).values(testPatients);
  console.log(`✓ Seeded ${testPatients.length} test patients`);

  return testPatients;
}

/**
 * Seed test lab results
 */
async function seedLabResults(userId, testPatients) {
  console.log('Seeding test lab results...');

  // Get all lab test definitions
  const definitions = await db.select().from(labTestDefinitions);
  const creatinineDef = definitions.find(d => d.name === 'Creatinine');
  const egfrDef = definitions.find(d => d.name === 'eGFR');
  const glucoseDef = definitions.find(d => d.name === 'Glucose');

  if (!creatinineDef || !egfrDef || !glucoseDef) {
    console.log('✗ Lab test definitions not found');
    return;
  }

  const primaryPatient = testPatients.find(p => p.isPrimary);

  if (!primaryPatient) {
    console.log('✗ Primary patient not found');
    return;
  }

  // Generate mock lab results over time
  const baseDate = new Date();
  const results = [];

  // Creatinine results (last 6 months)
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);

    results.push({
      id: uuidv4(),
      patientId: primaryPatient.id,
      labTestDefinitionId: creatinineDef.id,
      value: (1.0 + Math.random() * 0.4).toFixed(2),
      unit: creatinineDef.unit,
      date,
      isAbnormal: false,
      source: 'manual'
    });
  }

  // eGFR results (last 6 months)
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);

    results.push({
      id: uuidv4(),
      patientId: primaryPatient.id,
      labTestDefinitionId: egfrDef.id,
      value: Math.floor(75 + Math.random() * 20).toString(),
      unit: egfrDef.unit,
      date,
      isAbnormal: false,
      source: 'manual'
    });
  }

  // Glucose results (last 3 months)
  for (let i = 0; i < 4; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() - i);

    results.push({
      id: uuidv4(),
      patientId: primaryPatient.id,
      labTestDefinitionId: glucoseDef.id,
      value: Math.floor(90 + Math.random() * 20).toString(),
      unit: glucoseDef.unit,
      date,
      isAbnormal: false,
      source: 'manual'
    });
  }

  await db.insert(labTestResults).values(results);
  console.log(`✓ Seeded ${results.length} test lab results`);
}

/**
 * Run all seeds
 */
export async function seedDatabase() {
  console.log('Starting database seeding...\n');

  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log('Database already seeded. Skipping...\n');
      return;
    }

    // Seed in order
    await seedLabTestDefinitions();
    const testUsers = await seedUsers();
    const testPatients = await seedPatients(testUsers[0].id);
    await seedLabResults(testUsers[0].id, testPatients);

    console.log('\n✓ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
