# RailSafe360 – Intelligent Railway Safety & Maintenance Management Portal

RailSafe360 is an enterprise-grade, full-stack management portal designed for Indian Railways Electric Loco Sheds (inspired by **Electric Loco Shed, Jamalpur**). 

The portal integrates real-time train telemetries (RTIS), high-integrity collision prevention checks (Kavach), indoor localization systems (SLAM), predictive diagnostics, scheduling checklists, and automatic safety notifications in a unified web control center.

> [!NOTE]
> This is a conceptual application developed to demonstrate software architecture and computer science integrations within the Indian Railways framework. It is not an official product of Indian Railways.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite, TypeScript, Tailwind CSS, Leaflet Maps, Chart.js, Framer Motion)
- **Backend**: Node.js (Express.js, JWT, Role-Based Access controls)
- **Database**: MongoDB (Mongoose) with **automatic local JSON persistence fallback** if MongoDB is offline or unconfigured.

---

## 🚀 Key Modules

1. **Role-Based Authentication**: Secure JWT access with roles: `Admin`, `Loco Engineer`, `Maintenance Technician`, and `Inspector`.
2. **Cab DMI Simulator (Kavach)**: Interactive train cab interface showing current speeds, signal aspects, RFID beacon logs, and automatic brake interventions.
3. **RTIS Mapping**: Live Leaflet tracking showing trains moving on routes between major Indian hubs.
4. **SLAM Shed Mapping**: HTML5 Canvas rendering of the Jamalpur Shed layout, depicting an autonomous rover scanning tracks, avoiding obstacles, and localizing coordinates.
5. **Predictive AI Diagnostics**: SLAM/telemetry sensor check page (motor temperature, brake pipe pressures, vibration profiles) generating repair recommendations.
6. **Maintenance & Checklist Desk**: Complete workflow to schedule servicing, complete checklist items, and log technician remarks.
7. **Incident Report Desk**: Pilot logs for communication/mechanical failures with dynamic incident timelines.
8. **Report Center & Analytics**: Audit sheet generation (Excel CSV downloads / Print layouts) and Chart.js dashboards.

---

## 📁 File Navigation

### 📡 Backend Core
- [`server.js`](file:///C:/Railway/backend/server.js) — Express entry point and simulator bootstrap.
- [`db.js`](file:///C:/Railway/backend/config/db.js) — Dual-mode Mongoose and JSON DB driver.
- [`seed.js`](file:///C:/Railway/backend/utils/seed.js) — Seeding script for mock locomotives and profiles.
- [Models Directory](file:///C:/Railway/backend/models/) — Telemetry, user, and incident collections.
- [Controllers Directory](file:///C:/Railway/backend/controllers/) — Telemetry simulators and auth handlers.

### 💻 Frontend Client
- [`App.tsx`](file:///C:/Railway/frontend/src/App.tsx) — Main React router and role guards.
- [Pages Directory](file:///C:/Railway/frontend/src/pages/) — Kavach cabs, Leaflet maps, SLAM floorplans, and analytical charts.
- [`index.css`](file:///C:/Railway/frontend/src/index.css) — Custom glassmorphism styling and map layouts.

---

## 🧑‍💻 Quick Start

Refer to [INSTALLATION.md](file:///C:/Railway/INSTALLATION.md) for full setup instructions. To launch both the frontend and backend servers instantly on Windows:

```powershell
# Run the PowerShell startup script
.\start-portal.ps1
```

Alternatively, run them manually in separate terminals:

```bash
# 1. Start Express Backend
cd backend
npm install
npm run seed  # Seed the database
npm run dev   # Runs on http://localhost:5000

# 2. Start React Frontend
cd ../frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

Log in using one of the pre-seeded profiles listed on the login page (e.g. `admin@railsafe.gov.in` / `Password123`).
