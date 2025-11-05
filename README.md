# Golf Simulator Booking System

The system allows customers to book golf simulator time slots and provides an admin dashboard for managing reservations.

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- CORS middleware

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Axler1/golf-booking-system.git
cd golf-booking-system
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file:
``` text
PORT=3000
NODE_ENV=development
```
4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

- Health Check.
``` text
GET /api/health
```

- Get Available Time Slots.
``` text
GET /api/bookings/available?date=YYYY-MM-DD
```

- Create Booking.
``` text
POST /api/bookings
Body: {
"customer_name": "string",
"customer_email": "string",
"customer_phone": "string",
"booking_date": "YYYY-MM-DD",
"booking_time": "HH:MM",
"duration": number (hours),
"number_of_players": number
}
```

- Get All Bookings.
``` text
GET /api/bookings
```

- Cancel Booking.
``` text
DELETE /api/bookings/:id
```

## Database Schema

- Bookings Table
``` sql
id (PRIMARY KEY)
customer_name
customer_email
customer_phone
booking_date
booking_time
duration (hours)
number_of_players
total_price
status
created_at
```

- Time Slots Table
``` sql
id (PRIMARY KEY)
date
time
is_available
```
