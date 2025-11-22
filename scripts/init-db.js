import {
    initializeDatabase,
    testConnection,
    closePool
} from '../src/database/db-postgres.js';

async function main() {
    console.log('🚀 Starting database initialization...\n');

    try {
        // Test connection first
        console.log('Testing database connection...');
        await testConnection();
        console.log('');

        // Initialize database
        await initializeDatabase();
        console.log('');

        console.log('✅ Database initialization completed successfully!');
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await closePool();
        process.exit(0);
    }
}

main();
