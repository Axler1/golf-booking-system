import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const db = new Database('bookings.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  db.exec(schema);
  console.log('✅ Database initialized successfully');
  
  // Seed some time slots for testing (next 7 days, 9 AM to 8 PM)
  seedTimeSlots();
}

// Seed time slots for the next 7 days
function seedTimeSlots() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO time_slots (date, time, is_available) 
    VALUES (?, ?, 1)
  `);
  
  const today = new Date();
  const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateString = date.toISOString().split('T')[0];
    
    times.forEach(time => {
      insert.run(dateString, time);
    });
  }
  
  console.log('✅ Time slots seeded for next 7 days');
}

// Initialize on import
initializeDatabase();

export default db;
