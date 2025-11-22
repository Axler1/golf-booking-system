import {
    testConnection,
    closePool
} from '../src/database/db-postgres.js';

async function main() {
    console.log('🧪 Testing database connection...\n');

    try {
        await testConnection();
        console.log('\n✅ Database connection test PASSED!');
    } catch (error) {
        console.error('\n❌ Database connection test FAILED:', error.message);
        process.exit(1);
    } finally {
        await closePool();
        process.exit(0);
    }
}

main();
