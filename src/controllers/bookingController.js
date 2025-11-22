import pool, {
    getClient
} from '../database/db-postgres.js';

// Get all bookings (for admin dashboard)
export const getAllBookings = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        id,
        customer_name,
        customer_email,
        customer_phone,
        booking_date,
        booking_time,
        duration,
        number_of_players,
        total_price,
        status,
        created_at
      FROM bookings 
      ORDER BY booking_date DESC, booking_time DESC
    `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching all bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings'
        });
    }
};

// Get available time slots for a specific date
export const getAvailableSlots = async (req, res) => {
    try {
        const {
            date
        } = req.query;

        // Validation
        if (!date) {
            return res.status(400).json({
                success: false,
                error: 'Date parameter is required'
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const result = await pool.query(`
      SELECT 
        id,
        date,
        time,
        is_available
      FROM time_slots 
      WHERE date = $1 AND is_available = TRUE 
      ORDER BY time ASC
    `, [date]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch available slots'
        });
    }
};

// Create a new booking
export const createBooking = async (req, res) => {
    // Get a dedicated client for transaction
    const client = await getClient();

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

        // === VALIDATION ===

        // Check required fields
        if (!customer_name || !customer_email || !customer_phone ||
            !booking_date || !booking_time || !duration || !number_of_players) {
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

        // Validate phone format
        const phoneDigits = customer_phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Phone number must have at least 10 digits'
            });
        }

        // Validate duration (1-3 hours)
        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 3) {
            return res.status(400).json({
                success: false,
                error: 'Duration must be between 1 and 3 hours'
            });
        }

        // Validate number of players (1-6)
        const playersNum = parseInt(number_of_players);
        if (isNaN(playersNum) || playersNum < 1 || playersNum > 6) {
            return res.status(400).json({
                success: false,
                error: 'Number of players must be between 1 and 6'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(booking_date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        // Validate time format
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(booking_time)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid time format. Use HH:MM'
            });
        }

        // Validate booking is not in the past
        const bookingDateTime = new Date(`${booking_date}T${booking_time}:00`);
        const now = new Date();
        if (bookingDateTime < now) {
            return res.status(400).json({
                success: false,
                error: 'Cannot book time slots in the past'
            });
        }

        // Calculate total price
        const total_price = durationNum * 50;

        // === START TRANSACTION ===
        await client.query('BEGIN');

        // Lock and check if time slot is available
        const slotCheck = await client.query(`
      SELECT id, is_available 
      FROM time_slots 
      WHERE date = $1 AND time = $2 
      FOR UPDATE
    `, [booking_date, booking_time]);

        if (slotCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Time slot does not exist'
            });
        }

        if (!slotCheck.rows[0].is_available) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Time slot is not available'
            });
        }

        // Double-check: no active booking exists for this slot
        const existingBooking = await client.query(`
      SELECT id 
      FROM bookings 
      WHERE booking_date = $1 
        AND booking_time = $2 
        AND status != 'cancelled'
    `, [booking_date, booking_time]);

        if (existingBooking.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'This slot has just been booked. Please select another time.'
            });
        }

        // Insert the booking
        const insertResult = await client.query(`
      INSERT INTO bookings (
        customer_name, 
        customer_email, 
        customer_phone, 
        booking_date, 
        booking_time, 
        duration, 
        number_of_players, 
        total_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, booking_date, booking_time, total_price, created_at
    `, [
            customer_name,
            customer_email,
            customer_phone,
            booking_date,
            booking_time,
            durationNum,
            playersNum,
            total_price
        ]);

        // Mark the time slot as unavailable
        await client.query(`
      UPDATE time_slots 
      SET is_available = FALSE 
      WHERE date = $1 AND time = $2
    `, [booking_date, booking_time]);

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Booking created successfully:', insertResult.rows[0].id);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: insertResult.rows[0]
        });

    } catch (error) {
        // Rollback on any error
        await client.query('ROLLBACK');
        console.error('❌ Error creating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking. Please try again.'
        });
    } finally {
        // Always release the client back to the pool
        client.release();
    }
};

// Cancel/Delete a booking
export const cancelBooking = async (req, res) => {
    const client = await getClient();

    try {
        const {
            id
        } = req.params;

        // Validate ID
        const bookingId = parseInt(id);
        if (isNaN(bookingId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking ID'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Get booking details
        const bookingResult = await client.query(`
      SELECT 
        id, 
        booking_date, 
        booking_time, 
        status 
      FROM bookings 
      WHERE id = $1 
      FOR UPDATE
    `, [bookingId]);

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        const booking = bookingResult.rows[0];

        // Delete the booking
        await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

        // Make the time slot available again (only if it wasn't already cancelled)
        if (booking.status !== 'cancelled') {
            await client.query(`
        UPDATE time_slots 
        SET is_available = TRUE 
        WHERE date = $1 AND time = $2
      `, [booking.booking_date, booking.booking_time]);
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('✅ Booking cancelled successfully:', bookingId);

        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel booking'
        });
    } finally {
        client.release();
    }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            status
        } = req.body;

        // Validate ID
        const bookingId = parseInt(id);
        if (isNaN(bookingId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking ID'
            });
        }

        // Validate status
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Check if booking exists
        const checkResult = await pool.query(
            'SELECT id FROM bookings WHERE id = $1',
            [bookingId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        // Update the status
        await pool.query(
            'UPDATE bookings SET status = $1 WHERE id = $2',
            [status, bookingId]
        );

        console.log(`✅ Booking ${bookingId} status updated to: ${status}`);

        res.json({
            success: true,
            message: 'Booking status updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating booking status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking status'
        });
    }
};
