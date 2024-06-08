import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');

// Function to save JSON data to a file
export function saveJSONToFile(fid, data) {
  const filePath = path.join(dataDir, `${fid}.json`);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Data saved to ${filePath}`);
}

// Function to read JSON data from a file
export function readJSONFromFile(fid) {
  const filePath = path.join(dataDir, `${fid}.json`);

  if (!fs.existsSync(filePath)) {
    return null
  }

  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

const countFilePath = path.resolve('submissionCount.json');

export const getSubmissionCount = () => {
  if (!fs.existsSync(countFilePath)) {
    return 0;
  }
  const data = fs.readFileSync(countFilePath, 'utf8');
  return JSON.parse(data).count || 0;
};

export const incrementSubmissionCount = () => {
  const currentCount = getSubmissionCount();
  const newCount = currentCount + 1;
  fs.writeFileSync(countFilePath, JSON.stringify({ count: newCount }));
  return newCount;
};