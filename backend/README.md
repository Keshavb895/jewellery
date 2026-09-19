# JEWELS Backend

## Setup
1. Install MongoDB locally or use MongoDB Atlas.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` and a strong `JWT_SECRET`.
4. Run `npm install`.
5. Run `npm run dev`.

API: http://localhost:5000
Health check: http://localhost:5000/api/health

## Dynamic architecture
Products, categories and orders are stored in MongoDB. Admin-protected APIs support product/category CRUD and order status updates. The frontend can replace its demo product array with these API endpoints.
