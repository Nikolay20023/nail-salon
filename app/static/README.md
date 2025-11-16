# Nails Bot Frontend

Telegram Mini App frontend for booking nail salon appointments.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to `http://localhost:8000`):
```
VITE_API_URL=http://localhost:8000
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Pages

- `/my-booking` - List of user's bookings
- `/create-booking` - Create a new booking
- `/update-booking/:id` - Update an existing booking
- `/delete-booking/:id` - Delete a booking

## Features

- Telegram WebApp SDK integration
- Responsive design using Telegram theme variables
- Form validation
- Error handling
- Loading states
- Time slot selection

## Development

The app uses:
- React 18
- TypeScript
- Vite
- React Router
- Telegram WebApp SDK

