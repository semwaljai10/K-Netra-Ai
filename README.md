# 🌐 K-NETRA AI: Tactical Command & Intelligence Platform

> **Karnataka Police Network for Tactical Response & Analytics (KSP Tactical Unit)**
> 
> *An advanced, Next.js-powered command-center intelligence dashboard that transforms siloed police records and socio-economic indicators into real-time, actionable predictive insights.*

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
  - [1. Dashboard Command Center](#1-dashboard-command-center)
  - [2. Geospatial Hotspot Mapping](#2-geospatial-hotspot-mapping)
  - [3. Syndicate Links (Network Analysis)](#3-syndicate-links-network-analysis)
  - [4. Criminal Dossier Directory](#4-criminal-dossier-directory)
  - [5. Socio-Economic Correlation Analysis](#5-socio-economic-correlation-analysis)
  - [6. AI Predictor Model Simulator](#6-ai-predictor-model-simulator)
  - [7. Secure Incident Reporting (FIR Generator)](#7-secure-incident-reporting-fir-generator)
  - [8. Security & Admin Operations](#8-security--admin-operations)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Database Schema & Backend](#-database-schema--backend)
- [Installation & Setup](#%EF%B8%8F-installation--setup)
- [Usage Guide](#-usage-guide)
- [Security & Compliance](#-security--compliance)

---

## 🌟 Project Overview

**K-NETRA AI** (Karnataka Police Network for Tactical Response & Analytics) is a high-performance intelligence and analytics platform designed specifically for law enforcement operators in Karnataka. Built using modern web technologies, the platform parses complex criminal databases, extracts temporal-spatial trends, maps hotspots, models criminal networks (syndicates), correlates crime statistics with socio-economic factors, and generates legally-compliant First Information Reports (FIRs).

The system operates with a premium, high-fidelity dark/light UI themed with **glassmorphism** details, smooth micro-animations, and live-updated network graphs, providing tactical commanders with a mission-critical overview of state safety.

---

## 🛠️ Key Features

### 1. Dashboard Command Center
* **Live Telemetry & Metrics**: Tracks crucial performance indicators: active investigations, arrest rate percentages, critical anomalies, and overall threat index.
* **Spatio-Temporal Trend Spikes**: Custom Line/Area charts displaying crime density trends and temporal anomalies across regions.
* **Live Anomaly Feed**: Logs system-generated alerts (e.g., suspicious activity, database access anomalies, VPN triggers) with severity ratings.
* **Interactive Incident Feed**: Full-featured filterable database table of logged incidents supporting pagination, category filtering, search, and status management.

### 2. Geospatial Hotspot Mapping
* **Leaflet Map Integration**: Plots spatial distribution of incidents throughout Karnataka districts.
* **Heatmap & Clustered Indicators**: Visualizes dense criminal zones.
* **District/Police Station Layers**: Displays police station coverages and tactical division areas.
* **Real-time Map Sidebar**: Details selected points of interest, station metrics, and local division statistics.

### 3. Syndicate Links (Network Analysis)
* **Canvas Force-Directed Simulation**: High-performance network visualization showing how criminals associate.
* **Multi-Signal Linking Engine**: Correlates connections using specific weights:
  * *Co-accused in same FIR* (Weight: `0.40`)
  * *Shared phone numbers* (Weight: `0.35`)
  * *Shared vehicles* (Weight: `0.30`)
  * *Shared social handles* (Weight: `0.25`)
  * *Geo-temporal proximity* (Weight: `0.25`)
  * *Shared email addresses* (excluding generic domains; Weight: `0.20`)
* **Community Detection (Clustering)**: Automatic color-coded group clustering utilizing geometric convex hulls.
* **Centrality Metrics**: Computes **Degree Centrality** and **Betweenness Centrality** to identify network hubs, brokers, and kingpins.

### 4. Criminal Dossier Directory
* **Offender Profiles**: Interactive database profiles containing names, aliases, active status (*Active*, *Parole*, *Incarcerated*), risk ratings, and criminal histories.
* **Detailed Slide-out Dossiers**: Deep dive into individual criminal profiles, visual network associations, vehicle details, known contacts, and active case files.

### 5. Socio-Economic Correlation Analysis
* **Statistical Scatter Plots**: Correlates district-specific crime rates against socio-economic factors such as Unemployment Rates, Literacy Rates, and Poverty Indexes.
* **Regression Weights Matrix**: Explains how individual variables influence overall crime coefficients.
* **Insight Telemetry Cards**: Highlights positive/negative correlations with automated action recommendations.

### 6. AI Predictor Model Simulator
* **Interactive Regression Simulator**: Slide variables (Unemployment, Street Lighting, Patrol Frequency, Median Income) to predict crime rates per 100k population.
* **Multivariate Regression Engine**: Computes predictions in real-time, utilizing Dakshina Kannada district statistics as a baseline.
* **Terminal Telemetry Logs**: Real-time console logs simulating server-side neural calculations and regression matrix processing.

### 7. Secure Incident Reporting (FIR Generator)
* **Structured FIR Form**: Comprehensive form to log incident details, victim/suspect info, geospatial coordinates, and evidence summaries.
* **PDF Document Generator**: Compiles reported data into legally compliant, professionally formatted PDF documents.
* **Security Seals & Verification**: Imprints secure SHA-256 verification hashes, QR placeholders, and cryptographic stamps onto generated FIRs.

### 8. Security & Admin Operations
* **VPN Block Protocol 12.4**: Restricts platform access from active VPNs/proxies to prevent session hijacking and database exfiltration.
* **Operator Session Logs**: Tracks login attempts, role elevations, file exports, and configuration changes.
* **Access Control**: Role-based routing restricting the Admin console to authorized system administrators.

---

## 🖥️ Tech Stack

* **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
* **Library**: [React 19](https://react.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: Vanilla CSS with custom theme design system (dark/light/system modes), custom CSS modules, and custom glassmorphism components.
* **Charts**: [Chart.js](https://www.chartjs.org/) with [React-ChartJS-2](https://react-chartjs-2.js.org/)
* **Maps**: [Leaflet](https://leafletjs.com/) & [React Leaflet](https://react-leaflet.js.org/)
* **Document Export**: [jsPDF](https://github.com/parallax/jsPDF)
* **Backend Database**: [Supabase](https://supabase.com/) (PostgreSQL client integration)

---

## 🗄️ Database Schema & Backend

K-NETRA integrates with a PostgreSQL backend managed by **Supabase**. The core tables include:

1. **`incidents`**: Stores official case data (FIR numbers, incident categories, locations, dates, status, investigating officer, and details).
2. **`offenders`**: Holds profiles of known criminals, arrest statuses, and linked metadata.
3. **`operator_profiles`**: Governs credentials, access roles (Admin/Operator), and password change requirements.
4. **`security_logs`**: Logs all system events, login attempts, export events, and network violations.

*Note: The platform features a built-in JSON offline fallback (`src/lib/karnataka_crime_dataset.json`) to guarantee structural availability and fully-functional dashboard simulation if connection to the database is lost.*

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (v18.x or later)
* **npm** or **yarn** / **pnpm**
* A **Supabase** instance (optional, fallback is local JSON)

### 1. Clone the Repository
```bash
git clone https://github.com/semwaljai10/K-Netra-Ai.git
cd K-Netra-Ai
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🧭 Usage Guide

### Logging In
1. Open the platform.
2. Enter Operator credentials (e.g., standard operator access or Admin access). 
3. *Demo Admin Credentials (Mock Database)*:
   * **Username**: `admin` / `operator`
   * **Password**: Match standard testing credentials. Admins have access to the **Admin Security Logs** panel.

### Navigating the Views
Use the Left Sidebar to cycle through operational modes:
* **Dashboard Command**: Review main metrics, graphs, and the complete incident table.
* **Geospatial Hotspots**: Inspect map indicators. Filter by category or district.
* **Syndicate Links**: Interact with the force-directed graph. Drag nodes, adjust zoom levels, and filter connections by signal strength.
* **Criminal Dossiers**: Browse folders of known offenders. Click an offender to open their drawer dossier.
* **Socio-Economic Correlation**: Observe structural charts to guide policy decisions.
* **AI Predictor Model**: Change sliders and click **Run Simulator** to observe predicted rates.
* **Report Incident**: Fill the multi-step form, compile, and download the cryptographically signed FIR PDF.

---

## 🔒 Security & Compliance

K-NETRA enforces strict data protection rules:
1. **Network Integrity**: Evaluates incoming headers. If a VPN/Proxy is detected, users are redirected to the `/vpn-block` gateway under *K-NETRA Secure Protocol 12.4*.
2. **Session Ledger**: Every action (e.g., export of data, viewing of offender directories) is logged to the database audit trail.
3. **Cryptographic Validation**: FIRs are tagged with a unique hash verifying that the file originated from the secure command center.

---

*Disclaimer: This software is designed as a secure, high-fidelity mock dashboard simulating Karnataka State Police analytical workflows. All case studies, predictive matrices, and connection networks are simulated metrics designed to display modern telemetry analytics.*
