import db from '../database/db.js';

// Get all bookings (for admin)
export const getAllBookings = (req, res) => {
    try {
        const bookings = db.prepare('SELECT * FROM bookings ORDER BY booking_date, booking_time').all();
        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get available time slots for a specific date
export const getAvailableSlots = (req, res) => {
    try {
        const {
            date
        } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Date parameter is required'
            });
        }

        const slots = db.prepare(`
      SELECT * FROM time_slots 
      WHERE date = ? AND is_available = 1 
      ORDER BY time
    `).all(date);

        res.json({
            success: true,
            data: slots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create a new booking
export const createBooking = (req, res) => {
    try {
        const {
            customer_name,
            customer_email,
            customer_phone,
            booking_date,
            booking_time,
            duration,
            number_of_players
        } = req.body;

        // Validation
        if (!customer_name || !customer_email || !customer_phone || !booking_date || !booking_time || !duration || !number_of_players) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer_email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Validate phone format (basic check)
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(customer_phone) || customer_phone.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number'
            });
        }

        // Validate duration (1-3 hours)
        if (duration < 1 || duration > 3) {
            return res.status(400).json({
                success: false,
                error: 'Duration must be between 1 and 3 hours'
            });
        }

        // Validate number of players (1-6)
        if (number_of_players < 1 || number_of_players > 6) {
            return res.status(400).json({
                success: false,
                error: 'Number of players must be between 1 and 6'
            });
        }

        // Validate date (not in the past)
        const bookingDateTime = new Date(`${booking_date}T${booking_time}`);
        const now = new Date();
        if (bookingDateTime < now) {
            return res.status(400).json({
                success: false,
                error: 'Cannot book in the past'
            });
        }

        // Calculate price
        const total_price = duration * 50;

        // Check if slot is available
        const slot = db.prepare('SELECT * FROM time_slots WHERE date = ? AND time = ? AND is_available = 1').get(booking_date, booking_time);

        if (!slot) {
            return res.status(400).json({
                success: false,
                error: 'Time slot is not available'
            });
        }

        // Double-check: ensure no active booking exists for this slot
        const existingBooking = db.prepare(
            'SELECT * FROM bookings WHERE booking_date = ? AND booking_time = ? AND status != ?'
        ).get(booking_date, booking_time, 'cancelled');

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                error: 'This slot has just been booked. Please select another time.'
            });
        }

        // Use transaction for atomic operation
        const transaction = db.transaction(() => {
            // Create booking
            const insert = db.prepare(`
        INSERT INTO bookings (customer_name, customer_email, customer_phone, booking_date, booking_time, duration, number_of_players, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

            const result = insert.run(customer_name, customer_email, customer_phone, booking_date, booking_time, duration, number_of_players, total_price);

            // Mark time slot as unavailable
            db.prepare('UPDATE time_slots SET is_available = 0 WHERE date = ? AND time = ?').run(booking_date, booking_time);

            return result;
        });

        const result = transaction();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                id: result.lastInsertRowid,
                booking_date,
                booking_time,
                total_price
            }
        });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error. Please try again.'
        });
    }
};

// Delete/cancel a booking
export const cancelBooking = (req, res) => {
    try {
        const {
            id
        } = req.params;

        // Get booking info before deleting
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Delete booking
        db.prepare('DELETE FROM bookings WHERE id = ?').run(id);

        // Mark time slot as available again
        db.prepare('UPDATE time_slots SET is_available = 1 WHERE date = ? AND time = ?')
            .run(booking.booking_date, booking.booking_time);

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update booking status
export const updateBookingStatus = (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            status
        } = req.body;

        // Validate status
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }

        // Check if booking exists
        const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Update status
        db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);

        res.json({
            success: true,
            message: 'Booking status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
