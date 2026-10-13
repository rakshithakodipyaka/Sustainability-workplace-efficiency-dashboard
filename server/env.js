import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dotenv is a no-op when no .env file is present, so every value below has a
// built-in default and the app runs with or without a .env file.
const parsePort = (value) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : 4000;
};

export const PORT = parsePort(process.env.PORT);

export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, 'data', 'dashboard.db');
