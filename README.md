# PLMSys - Lamination Section Plate Lifecycle Monitoring System

**PLMSys** is a dedicated, 100% offline-first industrial web application designed for the **Lamination Section** to monitor and manage the full lifecycle of **laminating plates** across production cylinder sets and individual plate positions (P01–P11).

The system tracks the complete operational history of every laminating plate: installation, cycle accumulation, removal evaluation (**RETIRED** vs. **REJECTED**), multi-category defect classification, root-cause descriptions, source of reject, and corrective action histories. All data is securely persisted locally in the browser using **IndexedDB (Dexie.js)** with full JSON backup/restore and SQL dump capabilities.

---

## 📋 Table of Contents

- [Overview & Purpose](#-overview--purpose)
- [Key Features for Lamination Section](#-key-features-for-lamination-section)
- [Laminating Plate Lifecycle & Evaluation Workflow](#-laminating-plate-lifecycle--evaluation-workflow)
  - [1. Plate Statuses (Active, Retired, Rejected)](#1-plate-statuses)
  - [2. Defect Classification & Reject Reasons](#2-defect-classification--reject-reasons)
  - [3. Plate Serial Number Scheme](#3-plate-serial-number-scheme)
- [System Requirements](#-system-requirements)
- [Quick Start & Setup Guide](#-quick-start--setup-guide)
  - [⚡ One-Click Windows Launchers](#-one-click-windows-launchers)
  - [Manual Setup (Development)](#manual-development-setup)
  - [Production Setup & Start](#production-setup--start)
  - [Zero-Install Miniserve Setup (LAN / Factory PC)](#zero-install-miniserve-setup-lan--factory-pc)
- [User Guide](#-user-guide)
  - [1. Roles & Credentials](#1-roles--credentials)
  - [2. Cylinder Set & Position Management](#2-cylinder-set--position-management)
  - [3. Installing, Replacing & Retiring/Rejecting Plates](#3-installing-replacing--retiringrejecting-plates)
  - [4. Logging Daily Production & Supervisor Sign-Off](#4-logging-daily-production--supervisor-sign-off)
  - [5. Traceability, Plate Search & Audit Trail](#5-traceability-plate-search--audit-trail)
  - [6. Admin Tools, Backups & DB Studio](#6-admin-tools-backups--db-studio)
- [Project Architecture](#-project-architecture)
- [Frequently Asked Questions (FAQs)](#-frequently-asked-questions-faqs)

---

## 🏭 Overview & Purpose

In industrial lamination processes, laminating plates mounted on cylinder sets undergo continuous mechanical, thermal, and surface stress across thousands of production cycles. Maintaining strict quality control requires:

1. **Individual Plate Traceability**: Monitoring each laminating plate by its position slot (P01 through P11) and unique serial number (`MMDDYY-SET-POS`).
2. **Defect & Rejection Tracking**: Distinguishing plates that completed their normal useful life (**RETIRED**) from plates taken out of service due to quality defects or operational failures (**REJECTED**).
3. **Root Cause & Corrective Action Logging**: Recording the specific defect type (surface damage, cracking, chipping, excessive wear, dimensional failure, dents), detailed defect descriptions, source of reject, and corrective actions taken.
4. **Shift & Cycle Verification**: Tracking daily impression cycles with Job Order numbers (`0000-00` format), operator IDs, and supervisor sign-off authorization.

---

## ✨ Key Features for Lamination Section

- **Sets & Positions Dashboard**: Visual overview of all active lamination cylinder sets, total accumulated cycles, today's production, and active plate counts.
- **11-Position Visual Matrix**: Interactive slot-by-slot view (P01 to P11) showing current installed plate serial numbers, installation cycles, and real-time accumulated plate life (`Current Set Cycle - Install Cycle`).
- **Defect & Rejection Logging**: Built-in evaluation modal to categorize rejected laminating plates with multi-select defect tags, detailed notes, source of reject, and corrective action records.
- **Daily Production Logging**: Log shift cycles per cylinder set with automatic cycle calculation, Job Order validation (`0000-00`), operator selection, and mandatory supervisor password sign-off.
- **Global Plate Traceability Search**: Search laminating plates by serial number, manufacturing date, status (Active, Retired, Rejected), or cylinder set to view complete installation and removal ledgers.
- **Immutable Audit Trail**: Automatic audit logging (`AUD-XXXXXX`) with timestamps, operator IDs, supervisor sign-offs, and old vs. new value diffs.
- **100% Offline & Private**: Zero external cloud or database dependencies required. Works completely offline on shop-floor PCs and tablets.
- **Database Backup & SQL Export**: One-click JSON backup export/import, factory reset protection, and MySQL / PostgreSQL `.sql` schema and data dump generator.

---

## 🔬 Laminating Plate Lifecycle & Evaluation Workflow

```
[ New Plate Manufactured ] ───► [ Installed in Position (P01-P11) ]
                                          │
                                          ▼
                                [ Daily Production Cycles Logged ]
                                (Accumulates Plate Impressions)
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
          [ Normal Wear-Out ]                         [ Defect Identified ]
                    │                                           │
                    ▼                                           ▼
             Status: RETIRED                             Status: REJECTED
        (Reached target lifespan)                 (Logged with Defect Classification)
```

### 1. Plate Statuses

| Status | Definition | Description |
| :--- | :--- | :--- |
| **`ACTIVE`** | In Production | Plate is currently mounted on a cylinder position and accumulating production cycles. |
| **`RETIRED`** | Normal End-of-Life | Plate reached its target cycle threshold and was decommissioned without premature defect. |
| **`REJECTED`** | Quality / Defect Removal | Plate was removed prematurely due to surface defects, cracks, wear, or operational issues. |
| **`REPLACED`** | Swapped Out | Plate was replaced by another plate in the same position slot. |
| **`REMOVED`** | Demounted | Plate was dismounted from the cylinder position without immediate replacement. |

### 2. Defect Classification & Reject Reasons

When a laminating plate is flagged as **REJECTED**, operators and supervisors record:

- **Defect Category (`rejectType`)**:
  - `WEAR` — **Excessive Wear**: Uneven thinning or severe surface wear beyond allowable tolerance.
  - `SURFACE` — **Surface Damage**: Scratches, gouges, blisters, or foreign material impressions on the laminating surface.
  - `CRACK` — **Crack**: Structural fracture along the plate body, edges, or mounting bevels.
  - `CHIP` — **Chipping**: Missing material or chipped corners along working edges.
  - `DENT` — **Dent / Impact**: Physical dent caused by mechanical impact or foreign debris during lamination.
  - `DIM` — **Dimension Failure**: Plate stretching, shrinkage, or dimensional deviation causing misregistration.
  - `OTHER` — **Other Defect**: Unspecified or unique defect documented in the description.
- **Defect Description (`rejectDescription`)**: Detailed observations regarding the visual or measured defect.
- **Source of Reject (`sourceOfReject`)**: Identification of whether the defect originated from raw material, handling, machine error, or foreign object contamination.
- **Corrective Action (`correctiveAction`)**: Steps taken to address the root cause and prevent recurrence on subsequent runs.

### 3. Plate Serial Number Scheme

PLMSys automatically generates standardized plate serial numbers in the format:
```
MMDDYY-SET-POS
Example: 082926-01-05 (Manufactured Aug 29, 2026, for Set 01, Position P05)
```

---

## 🖥 System Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Web Browser**: Any modern browser with IndexedDB support (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
- **Operating System**: Windows 10/11, macOS, Linux, or factory tablet devices.

---

## 🚀 Quick Start & Setup Guide

### ⚡ One-Click Launchers (Windows, Linux, macOS)

Executable scripts are provided in the root directory for shop-floor operators and supervisors:

- **`START-MINISERVE.bat`** *(NEW)*: High-performance, zero-install launcher using the latest **Miniserve v0.35.0**. Automatically downloads `miniserve.exe` if not found, binds to `0.0.0.0:3000` for full Local Area Network (LAN) tablet connectivity, and opens the browser.
- **`start-miniserve.sh`** *(NEW)*: Linux/macOS high-performance Miniserve launcher (`./start-miniserve.sh`).
- **`START.bat`**: Development server launcher with automatic Node.js dependency checks and live browser launch.
- **`START-PRODUCTION.bat`**: Compiles a fresh production bundle (`npm run build`) and starts the Express production server.
- **`start.sh`**: Shell development launcher for Linux and macOS environments (`./start.sh`).

---

### Manual Development Setup

1. **Clone or Extract the Project**:
   ```bash
   git clone <repository-url>
   cd plmsys
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000`.

---

### Production Setup & Start

1. **Build the Production Bundle**:
   ```bash
   npm run build
   ```
   *Compiles the Vite static frontend into `dist/` and bundles `server.ts` into `dist/server.cjs`.*

2. **Start Production Server**:
   ```bash
   npm start
   ```
   *The Express server serves the static application on `http://localhost:3000`.*

---

### 🌐 Zero-Install Miniserve Setup (LAN / Factory Air-Gapped PCs)

For air-gapped shop-floor PCs, touchscreen consoles, and tablets without Node.js installed, use the latest [**Miniserve v0.35.0**](https://github.com/svenstaro/miniserve):

#### 1. Automated 1-Click Launch (Windows)
Double-click **`START-MINISERVE.bat`**. The script will:
- Check for `miniserve.exe` (and automatically download it via PowerShell if missing)
- Build the production bundle into `dist/` if not present
- Display your machine's local IPv4 network address
- Launch Miniserve on `http://0.0.0.0:3000` in Single-Page Application (SPA) mode
- Open your browser to `http://localhost:3000`

#### 2. Manual Miniserve Installation & Launch

**Download Binaries (Miniserve v0.35.0):**
- **Windows (x86_64)**: [miniserve-v0.35.0-x86_64-pc-windows-msvc.exe](https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-pc-windows-msvc.exe) *(rename to `miniserve.exe`)*
- **Linux (x86_64)**: [miniserve-v0.35.0-x86_64-unknown-linux-musl](https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-unknown-linux-musl)
- **macOS (Apple Silicon)**: [miniserve-v0.35.0-aarch64-apple-darwin](https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-aarch64-apple-darwin)
- **macOS (Intel)**: [miniserve-v0.35.0-x86_64-apple-darwin](https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-apple-darwin)

**Package Managers:**
```bash
# Windows (winget)
winget install svenstaro.miniserve

# Rust Cargo
cargo install miniserve

# macOS Homebrew
brew install miniserve
```

**Run Miniserve Command:**
```cmd
# Standard Production SPA Server (LAN Enabled on port 3000)
miniserve --spa --index index.html --port 3000 --interfaces 0.0.0.0 dist

# With HTTP Basic Authentication
miniserve --spa --index index.html --port 3000 --auth admin:JADB1994 --interfaces 0.0.0.0 dist
```

#### 3. Connecting Factory Tablets / LAN Client Devices
1. Ensure the host computer and client tablets/PCs are on the same local network (Wi-Fi or Ethernet).
2. Open Windows Firewall port 3000 if prompted, or run in Administrator PowerShell/CMD:
   ```cmd
   netsh advfirewall firewall add rule name="PLMSys Miniserve" dir=in action=allow protocol=TCP localport=3000
   ```
3. Find the host IP address with `ipconfig` (e.g., `192.168.1.100`).
4. On any tablet or shop-floor device, open:
   ```
   http://192.168.1.100:3000
   ```

#### 4. In-App Miniserve Hub
Administrators can also navigate to **Admin Control Center** > **Miniserve LAN Server** inside PLMSys to access the interactive live command configurator, generate custom ports, and download batch scripts directly.

---

## 📖 User Guide

### 1. Roles & Credentials

- **Operator**: Standard operator role for logging daily production cycles, mounting plates, viewing set statuses, and searching plate histories.
- **Admin / Supervisor**: Full administrative access for creating sets, editing personnel registry, supervisor sign-offs, database backups, and factory reset operations.
  - **Default Admin Password**: `JADB1994` (or `admin`)
  - **Supervisor Sign-off Passwords**: Configured in Personnel Management (default: `JADB1994`, `admin`, `superadmin`, `supervisor`).

---

### 2. Cylinder Set & Position Management

1. Click **New Production Set** in the header or dashboard.
2. Enter the **Set Number** (e.g., `1`), **Target Cycle Limit**, and optional notes.
3. Upon creation, the system automatically initializes **11 fixed position slots (P01 through P11)** and installs initial active plates.
4. Click any set to open the **Set Monitoring View** with the visual 11-position matrix.

---

### 3. Installing, Replacing & Retiring/Rejecting Plates

1. In **Set Monitoring**, click any position slot card (P01–P11).
2. To replace or decommission an active plate, select **Replace Plate**:
   - Choose the removal outcome: **RETIRED** (normal end-of-life) or **REJECTED** (defective).
   - If **REJECTED**, select the defect classification (`Excessive Wear`, `Crack`, `Surface Damage`, `Chipping`, `Dent`, `Dimension Failure`, or `Other`).
   - Enter detailed **Defect Description**, **Source of Reject**, and **Corrective Action**.
   - Input or auto-generate the new replacement plate serial number.
   - Select the installing operator and submit.
3. All historical installations and removals for that slot are preserved in the **Position History Ledger**.

---

### 4. Logging Daily Production & Supervisor Sign-Off

1. Click **Log Production** in the navigation bar.
2. Select the target **Cylinder Set**.
3. Input the **Production Cycles Added** (e.g., `25,000`).
4. Enter the **Job Order Number** (strictly validated format: `0000-00`, e.g., `1042-01`).
5. Select the **Operator Name** and current production date.
6. Enter a valid **Supervisor Password** for quality sign-off authorization.
7. Click **Save Production Log**. The system automatically increments the total set cycle count and all currently installed plate lifespans.

---

### 5. Traceability, Plate Search & Audit Trail

- **Global Plate Search**: Open the **Search** tab to query any plate serial number (`MMDDYY-SET-POS`), manufacturing date, or status. View its full lifecycle timeline, which set/position it was mounted on, and why it was retired or rejected.
- **Daily Production Ledger**: View chronological production logs with previous cycle, added cycles, resulting cycle, operator, supervisor sign-off, and Job Order. Filter by set or operator.
- **Audit Logs**: Open the **Audit Logs** tab to inspect all logged actions (`AUD-XXXXXX`), timestamps, set/position IDs, operator credentials, and previous vs. updated value diffs.

---

### 6. Admin Tools, Backups & DB Studio

Click **Admin** in the navigation bar (Password: `JADB1994`):

- **Export Backup**: Download a complete JSON snapshot containing all sets, positions, plates, installations, removals, production logs, personnel, and audit trails.
- **Import Backup**: Restore application state from a JSON backup file.
- **Factory Reset**: Clear local database state and re-seed defaults (requires typing `"RESET"`).
- **Database & Schema Studio**: Built-in visual database manager with table inspection, schema DDL viewers, query runners, and MySQL / PostgreSQL `.sql` dump generation.

---

## 📁 Project Architecture

```
plmsys/
├── .github/
│   └── workflows/
│       └── web-app-ci.yml    # CI verification & build pipeline
├── START.bat                 # One-click Windows development launcher
├── START-PRODUCTION.bat      # One-click Windows production build & launcher
├── start.sh                  # Linux/macOS launcher
├── src/
│   ├── components/           # React UI views, modals, matrices, and dashboards
│   │   ├── AdminDashboard.tsx
│   │   ├── AuditLogView.tsx
│   │   ├── CreateSetModal.tsx
│   │   ├── DailyProductionView.tsx
│   │   ├── DatabaseManagerView.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── LogProductionModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── PositionModal.tsx
│   │   ├── RegistryModal.tsx
│   │   ├── SetDetail.tsx
│   │   └── TutorialModal.tsx
│   ├── db/
│   │   └── db.ts             # Dexie IndexedDB schema, models & initial seeds
│   ├── App.tsx               # Primary application state, modal routing & handlers
│   ├── main.tsx              # React DOM root entry point with ErrorBoundary
│   ├── types.ts              # TypeScript type declarations & defect schemas
│   └── utils.ts              # Serial number generators & formatters
├── server.ts                 # Express server with Vite middleware integration
├── package.json              # Project dependencies, scripts & metadata
└── README.md                 # Complete documentation & operator guide
```

---

## ❓ Frequently Asked Questions (FAQs)

### Q: What is the difference between RETIRED and REJECTED plates?
- **RETIRED plates** have completed their expected production lifecycle without unexpected failure or quality issues.
- **REJECTED plates** are taken out of service prematurely due to defects (such as cracks, surface damage, chipping, or dimensional failure), requiring root-cause classification and corrective action logging.

### Q: Where is the data stored?
All data is stored directly in the local browser's **IndexedDB** database (`PlateDatabase`). No data is sent over the public internet, ensuring complete privacy and offline autonomy.

### Q: How do we prevent data loss when switching computers?
Use the **Export Backup** feature in the **Admin Dashboard** or **Database Manager** to download a `.json` backup file, then click **Import Backup** on the new computer.

### Q: What is the default Admin password?
The default system supervisor password is **`JADB1994`** (or `admin`). You can manage authorized supervisors and operators in the **Personnel Registry**.
