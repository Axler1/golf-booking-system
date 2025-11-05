import db from '../database/db.js';

// Get all bookings (for admin)
export const getAllBookings = (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY booking_date, booking_time').all();
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available time slots for a specific date
export const getAvailableSlots = (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date parameter is required' });
    }
    
    const slots = db.prepare(`
      SELECT * FROM time_slots 
      WHERE date = ? AND is_available = 1 
      ORDER BY time
    `).all(date);
    
    res.json({ success: true, data: slots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new booking
export const createBooking = (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, booking_date, booking_time, duration, number_of_players } = req.body;
    
    // Validation
    if (!customer_name || !customer_email || !customer_phone || !booking_date || !booking_time || !duration || !number_of_players) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    
    // Calculate price ($50/hour)
    const total_price = duration * 50;
    
    // Check if slot is available
    const slot = db.prepare('SELECT * FROM time_slots WHERE date = ? AND time = ? AND is_available = 1').get(booking_date, booking_time);
    
    if (!slot) {
      return res.status(400).json({ success: false, error: 'Time slot is not available' });
    }
    
    // Create booking
    const insert = db.prepare(`
      INSERT INTO bookings (customer_name, customer_email, customer_phone, booking_date, booking_time, duration, number_of_players, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insert.run(customer_name, customer_email, customer_phone, booking_date, booking_time, duration, number_of_players, total_price);
    
    // Mark time slot as unavailable
    db.prepare('UPDATE time_slots SET is_available = 0 WHERE date = ? AND time = ?').run(booking_date, booking_time);
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete/cancel a booking
export const cancelBooking = (req, res) => {
  try {
    const { id } = req.params;
    
    // Get booking info before deleting
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    
    // Delete booking
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    
    // Mark time slot as available again
    db.prepare('UPDATE time_slots SET is_available = 1 WHERE date = ? AND time = ?')
      .run(booking.booking_date, booking.booking_time);
    
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
