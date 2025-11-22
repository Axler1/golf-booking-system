import {
    getAllBookings
} from '../../src/controllers/bookingController.js';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).setHeader(Object.keys(corsHeaders).map(key => [key, corsHeaders[key]])).end();
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method === 'GET') {
        return await getAllBookings(req, res);
    }

    return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
    });
}
