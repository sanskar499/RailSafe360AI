# RailSafe360 - Installation & Operations Guide

This document outlines the step-by-step instructions to configure, run, and deploy the RailSafe360 system on a local machine or production environment.

---

## 📋 System Prerequisites

Ensure you have the following installed on your host system:
- **Node.js**: Version 18.x or newer (Tested on v24.13.0)
- **NPM**: Version 9.x or newer (Tested on v11.6.2)
- **MongoDB** (Optional): A local instance or MongoDB Atlas Connection String. If absent, the application automatically uses a persistent local JSON database (`backend/data/db/`).

---

## 📡 Backend Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory using the provided sample:
   ```env
   PORT=5000
   JWT_SECRET=railsafe360_super_secret_jamalpur_key
   
   # Optional: Configure MongoDB Atlas (Comment out to use fallback JSON DB)
   # MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/railsafe360?retryWrites=true&w=majority
   ```

4. Seed the Database:
   Generate mock accounts, locomotives, and telemetry logs:
   ```bash
   npm run seed
   ```

5. Launch Server in Development Mode:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

---

## 💻 Frontend Installation

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Launch Vite Development Server:
   ```bash
   npm run dev
   ```
   The frontend console will output the active address, typically `http://localhost:5173`. Open this URL in your web browser.

---

## 🔑 Pre-Seeded Profiles

To facilitate quick testing of different dashboard roles, use the quick credentials panel on the login screen or enter manually:

| Employee Role | Email Address | Password | Employee ID |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@railsafe.gov.in` | `Password123` | `EMP-ADMIN-01` |
| **Loco Engineer** | `engineer@railsafe.gov.in` | `Password123` | `EMP-LE-05` |
| **Maintenance Tech** | `technician@railsafe.gov.in` | `Password123` | `EMP-MT-12` |
| **Quality Inspector** | `inspector@railsafe.gov.in` | `Password123` | `EMP-IN-03` |

---

## 📦 Production Bundling

To compile optimized assets for production deployments:

```bash
# Compile and check TypeScript types
cd frontend
npm run build
```
This generates a static `dist/` directory that can be deployed directly to static web hosts such as Vercel, Netlify, or AWS S3.
