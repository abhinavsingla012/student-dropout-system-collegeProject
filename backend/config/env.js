import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendRoot = join(__dirname, '..');

const candidatePaths = [
  join(backendRoot, '.env'),
  join(backendRoot, '..', '.env'),
];

for (const path of candidatePaths) {
  if (existsSync(path)) {
    dotenv.config({ path, override: false });
    break;
  }
}
