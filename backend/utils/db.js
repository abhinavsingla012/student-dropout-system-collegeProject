import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// Data file paths (relative to this file, which is in /utils)
export const STUDENTS_FILE      = join(__dirname, '..', 'data', 'students.json');
export const INTERVENTIONS_FILE = join(__dirname, '..', 'data', 'interventions.json');
export const USERS_FILE         = join(__dirname, '..', 'data', 'users.json');

export async function readJSON(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

export async function writeJSON(filePath, data) {
  try {
    await writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
  }
}
