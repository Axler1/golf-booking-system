import {
    createBooking
} from '../../src/controllers/bookingController.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        Object.entries(corsHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).end();
    }

    // Set CORS headers for all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Only allow POST method
    if (req.method === 'POST') {
        return await createBooking(req, res);
    }

    // Return error for other methods
    return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed. Use POST.`
    });
}
