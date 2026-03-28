# Finora

Full-stack MERN personal finance platform with:
- JWT auth
- Landing, about, pricing, contact
- Dashboard overview
- Wallet, expenses, investments, goals, reports, notifications, profile
- Expense and investment wallet sync

## Demo account
Run backend seed:
- Email: `user1@gmail.com`
- Password: `finora123`

## Setup
### Backend
```bash
cd server
npm install
npm run seed
npm start
```

### Frontend
```bash
cd finora-dashboard
npm install
npm run dev
```

Optional frontend env:
```env
VITE_API_URL=http://localhost:5000
```
