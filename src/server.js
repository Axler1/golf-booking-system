import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookingRoutes.js';
import {
    testConnection
} from './database/db-postgres.js';

// Load environment variables
dotenv.config({
    path: '.env.local'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/bookings', bookingRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await testConnection();
        res.json({
            status: 'ok',
            message: 'Golf Booking API is running',
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/health`);

    // Test database connection on startup
    try {
        await testConnection();
    } catch (error) {
        console.error('⚠️  Failed to connect to database on startup');
    }
});
