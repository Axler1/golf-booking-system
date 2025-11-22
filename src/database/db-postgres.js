import pg from 'pg';
import fs from 'fs';
import path from 'path';
import {
    fileURLToPath
} from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({
    path: '.env.local'
});

const {
    Pool
} = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection pool
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ?
        {
            rejectUnauthorized: false
        } :
        false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error if connection takes longer than 2 seconds
});

// Event handlers for pool
pool.on('connect', (client) => {
    console.log('✅ New client connected to PostgreSQL database');
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle PostgreSQL client:', err);
    // Don't exit process - Vercel will handle this
});

pool.on('remove', (client) => {
    console.log('Client removed from pool');
});

// Test database connection
export async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connection successful:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

// Initialize database with schema
export async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('📊 Initializing database schema...');

        const schemaPath = path.join(__dirname, 'schema-postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Execute schema
        await client.query(schema);
        console.log('✅ Database schema initialized successfully');

        // Seed time slots
        await seedTimeSlots(client);

        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Seed time slots for the next 7 days
async function seedTimeSlots(client) {
    try {
        console.log('🌱 Seeding time slots...');

        const times = [
            '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00',
            '17:00', '18:00', '19:00', '20:00'
        ];

        const today = new Date();
        let insertCount = 0;

        for (let day = 0; day < 7; day++) {
            const date = new Date(today);
            date.setDate(today.getDate() + day);
            const dateString = date.toISOString().split('T')[0];

            for (const time of times) {
                const result = await client.query(
                    `INSERT INTO time_slots (date, time, is_available) 
           VALUES ($1, $2, TRUE) 
           ON CONFLICT (date, time) DO NOTHING
           RETURNING id`,
                    [dateString, time]
                );

                if (result.rowCount > 0) insertCount++;
            }
        }

        console.log(`✅ Seeded ${insertCount} time slots for next 7 days`);
    } catch (error) {
        console.error('❌ Error seeding time slots:', error.message);
        throw error;
    }
}

// Helper function to execute queries with logging
export async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executed:', {
            query: text.substring(0, 50) + '...',
            duration: `${duration}ms`,
            rows: res.rowCount
        });
        return res;
    } catch (error) {
        console.error('Query error:', {
            query: text,
            error: error.message
        });
        throw error;
    }
}

// Get a client from the pool (for transactions)
export async function getClient() {
    const client = await pool.connect();

    // Add transaction helpers
    client.queryWithLogging = async (text, params) => {
        const start = Date.now();
        const res = await client.query(text, params);
        const duration = Date.now() - start;
        console.log('Transaction query:', {
            query: text.substring(0, 50) + '...',
            duration: `${duration}ms`
        });
        return res;
    };

    return client;
}

// Graceful shutdown
export async function closePool() {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (error) {
        console.error('❌ Error closing database pool:', error);
    }
}

// Export pool for direct access if needed
export default pool;
