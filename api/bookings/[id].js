import {
    cancelBooking
} from '../../src/controllers/bookingController.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    if (req.method === 'DELETE') {
        // Extract ID from query params (Vercel passes it this way)
        req.params = {
            id: req.query.id
        };
        return await cancelBooking(req, res);
    }

    return res.status(405).json({
        success: false,
        error: `Method ${req.method} not allowed`
    });
}
