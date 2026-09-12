# VENDRA - Production-Ready Mobile-First Financial Platform

VENDRA is an enterprise-grade, mobile-first financial platform built for seamless Mobile Money deposits, asset-backed commercial equipment yield participation, verified double-entry transaction ledgers, multi-level referral tracking, and secure administrative withdrawal controls.

---

## 🌟 Key Architecture & Highlights

- **Mobile-First Experience**: Tailored for Android phones, iPhones, tablets, and desktop browsers with high contrast, readable typography, and tactile bottom navigation (Home, Products, Team, Mine).
- **Legitimate Financial Ledger**: Balances are **never** stored or edited directly from the frontend. The displayed balance is mathematically derived from verified credit and debit ledger records in the database.
- **Double-Spend Prevention**: Withdrawals immediately reserve funds with an atomic transaction lock (`WITHDRAWAL_RESERVE` with status `PENDING`), reducing the user's available balance before admin review.
- **Uganda Mobile Money Gateway Integration**: Prepared for MTN MoMo and Airtel Money Uganda USSD push collections and disbursements with HMAC-SHA256 signature verification.
- **Admin Configurable Products**: Admin can create and calibrate equipment and infrastructure products with customizable terms, daily yield rates, duration, and purchase limits. All projected figures are calculated deterministically by formula with clear risk disclaimers.
- **Multi-Level Referral Engine**: Tiered commissions (Level 1 & Level 2) calculated strictly from qualifying transactions of eligible members.
- **Role-Based Access Control**: Strict segregation between standard Users, Admins, and Super Admins.
- **Ready for Bolt Hosting / Docker**: Modular Express + Vite architecture with full PostgreSQL / Supabase migration scripts.

---

## 🚀 Quick Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `PORT`: Set to `3000` (or leave default)
- `JWT_SECRET`: A secure 32+ character random string for signing auth tokens
- `DATABASE_URL`: (Optional) PostgreSQL / Supabase connection string. If omitted, VENDRA runs on its built-in local ACID file-backed relational ledger.
- `MOMO_WEBHOOK_SECRET`: Secret key for verifying Uganda Mobile Money webhook signatures

### 3. Run Database Migrations (for PostgreSQL / Supabase)
If connecting to PostgreSQL or Supabase:
```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_seed_demo_products.sql
```

### 4. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:3000`.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🔑 Default Administrator Credentials

For evaluation and administrative control:
- **Phone Number**: `+256700000001`
- **Password**: `AdminPassword123!`
- **Role**: `super_admin`

---

## 📊 Database Tables (14 Total)

1. `users`: Core identity, phone, hashed password, role, referral code, status
2. `profiles`: Full name, email, National ID (NIN), KYC status, Mobile Money provider and number
3. `products`: Asset names, pricing (UGX 10,000+), terms, return rates, purchase limits
4. `product_purchases`: Active/completed terms, start/end dates, accrued yields
5. `deposits`: Mobile Money payment intents, amounts, references, gateway IDs, confirmation timestamps
6. `withdrawals`: Payout requests, reserve amounts, status, admin reviews, payout references
7. `transactions`: Verified double-entry audit ledger recording every balance change
8. `referral_relationships`: Directed referral graph (Level 1 direct & Level 2 indirect)
9. `referral_rewards`: Commission credits tied to specific qualifying transactions
10. `notifications`: Real-time user notification events (deposits, payouts, yields, security)
11. `support_tickets`: Support requests, categories, status, and administrative responses
12. `admin_users`: Administrative permissions and privilege records
13. `audit_logs`: Immutable security log tracking all administrative and sensitive operations
14. `platform_settings`: Dynamic operational settings (minimum deposit, withdrawal, commission rates)

---

## 🔒 Security Compliance

- Passwords hashed using bcrypt with salt rounds of 10.
- JWT bearer tokens signed server-side and validated via middleware.
- Webhooks protected with HMAC-SHA256 signature verification.
- Rate limiting and input validation on all financial inputs.
- No frontend API keys or sensitive credentials exposed to the client.
