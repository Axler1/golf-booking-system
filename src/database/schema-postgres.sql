-- Drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 3),
  number_of_players INTEGER NOT NULL CHECK (number_of_players >= 1 AND number_of_players <= 6),
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_date_time UNIQUE(date, time)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_date_time ON time_slots(date, time);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_available) WHERE is_available = TRUE;

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Stores customer booking information';
COMMENT ON TABLE time_slots IS 'Stores available time slots for booking';
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, completed, or cancelled';
COMMENT ON COLUMN time_slots.is_available IS 'Whether this time slot can be booked';
