import { updateBookingStatus } from '../../../src/controllers/bookingController.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'PATCH') {
    // Extract ID from query params
    req.params = { id: req.query.id };
    return await updateBookingStatus(req, res);
  }
  
  return res.status(405).json({ 
    success: false, 
    error: `Method ${req.method} not allowed` 
  });
}
