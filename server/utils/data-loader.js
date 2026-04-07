/**
 * Data Loader Utility
 * Loads sample/test data for development and testing
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load sample lab data
 * @returns {Promise<Object>} Lab data object
 */
export async function loadSampleData() {
  try {
    const dataPath = join(__dirname, '../../data/sample-data.json');
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading sample data:', error);
    // Return empty structure if file doesn't exist
    return {
      patient: {
        id: '1',
        name: 'Sample Patient',
        dateOfBirth: '1990-01-01',
        gender: 'unknown'
      },
      labTests: []
    };
  }
}

/**
 * Load specific data file
 * @param {string} filename - Name of the data file
 * @returns {Promise<Object>} Data object
 */
export async function loadDataFile(filename) {
  try {
    const dataPath = join(__dirname, '../../data', filename);
    const data = await readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading data file ${filename}:`, error);
    throw error;
  }
}

export default {
  loadSampleData,
  loadDataFile
};
