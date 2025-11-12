import express from 'express';
import {
    getAllBookings,
    getAvailableSlots,
    createBooking,
    cancelBooking,
    updateBookingStatus
} from '../controllers/bookingController.js';

const router = express.Router();

// GET /api/bookings - Get all bookings
router.get('/', getAllBookings);

// GET /api/bookings/available?date=YYYY-MM-DD - Get available slots
router.get('/available', getAvailableSlots);

// POST /api/bookings - Create new booking
router.post('/', createBooking);

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', cancelBooking);

// PATCH /api/bookings/:id - Update booking status
router.patch('/:id', updateBookingStatus);

export default router;
