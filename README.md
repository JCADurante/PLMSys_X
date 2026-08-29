# PLMSys - Printing Plate & Cylinder Set Management System

PLMSys is a 100% offline, standalone local web application designed for flexographic printing plate and cylinder set lifecycle management. It enables production teams to track mold plates, cylinder positions, daily production cycles, job orders, operator logs, supervisor sign-offs, and complete audit history. All application data is securely persisted locally in your browser using **IndexedDB (Dexie)**.

---

## 📋 Table of Contents

- [Features](#-features)
- [System Requirements](#-system-requirements)
- [Setup & Installation Guide](#-setup--installation-guide)
  - [Development Setup](#1-development-setup)
  - [Production Setup & Server](#2-production-setup--server)
  - [Downloading via GitHub ZIP](#3-downloading-via-github-zip)
  - [Zero-Install Miniserve Setup (Offline & LAN Guide)](#4-zero-install-miniserve-setup-complete-offline--lan-guide)
  - [Alternative Server Options (`npx serve`)](#5-alternative-server-options-npx-serve)
- [How to Use the Application (User Guide)](#-how-to-use-the-application-user-guide)
  - [1. User Roles & Default Passwords](#1-user-roles--default-passwords)
  - [2. Navigation Overview](#2-navigation-overview)
  - [3. Managing Cylinder Sets & Positions](#3-managing-cylinder-sets--positions)
  - [4. Installing, Replacing & Removing Mold Plates](#4-installing-replacing--removing-mold-plates)
  - [5. Logging Daily Production Cycles](#5-logging-daily-production-cycles)
  - [6. Reviewing Daily Production & History](#6-reviewing-daily-production--history)
  - [7. Audit Trail & Search](#7-audit-trail--search)
  - [8. Admin Dashboard, Backups & DB Studio](#8-admin-dashboard-backups--db-studio)
- [Project Architecture](#-project-architecture)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ✨ Features

- **Dashboard & Set Tracking**: Real-time view of active sets, cycle counts, target limits, and operational statuses.
- **Position Grid**: Interactive visual matrix of plate positions on each cylinder set.
- **Plate Lifecycle Management**: Track individual plate serial numbers, installation dates, wear thresholds, replacement history, and removal reasons.
- **Production Logging**: Log daily impression cycles with Job Order tracking (`0000-00` format), operator details, and required supervisor sign-off verification.
- **Immutable Audit Logging**: Automatic recording of all administrative and operational actions for quality assurance and compliance.
- **Database Backups & Recovery**: Export full database snapshots to JSON files and restore data seamlessly.
- **Database & Schema Studio**: Built-in Admin DB Studio for inspecting, querying, and managing IndexedDB collections directly inside the browser.
- **Offline & Private**: Zero external database or cloud connection required. All data resides 100% on the local user machine.

---

## 🖥 System Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Modern Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari with IndexedDB support.
- **Operating System**: Windows, macOS, or Linux.

---

## 🚀 Setup & Installation Guide

### ⚡ Quick One-Click Setup (Windows)

For Windows users, convenience batch scripts are provided in the root folder so you don't need to open a terminal:

- **`START.bat`**: Double-click to automatically check dependencies, run `npm install` if needed, start the development server, and automatically launch `http://localhost:3000` in your default web browser!
- **`START-PRODUCTION.bat`**: Double-click to compile a production build and launch the production server with browser auto-opening.
- **`start.sh`**: Double-click or execute (`./start.sh`) for macOS / Linux users.

---

### 1. Manual Development Setup

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

4. **Access Application**:
   Open your browser and navigate to `http://localhost:3000`.

---

### 2. Production Setup & Server

To compile the application for production deployment:

1. **Build the Production Asset Bundle**:
   ```bash
   npm run build
   ```
   *This compiles the Vite static frontend into `dist/` and bundles `server.ts` into `dist/server.cjs`.*

2. **Start Production Server**:
   ```bash
   npm start
   ```
   *The Express backend server will serve the static application on `http://localhost:3000`.*

---

### 3. Downloading via GitHub ZIP

#### Option A: Source Code ZIP
1. Navigate to the main repository page on GitHub.
2. Click the green **Code** button at the top right.
3. Select **Download ZIP** and extract it on your local computer.
4. Follow the [Development Setup](#1-development-setup) instructions above.

#### Option B: Pre-Built Standalone Web Bundle ZIP (`plmsys-local-web-app.zip`)
1. Open the **Actions** tab on your GitHub repository.
2. Select the latest **Local Web App Verification & Release CI** workflow run.
3. Scroll down to the **Artifacts** section at the bottom.
4. Download **`plmsys-local-web-app`** (ZIP containing ready-to-serve production HTML/JS assets).

---

### 4. Zero-Install Miniserve Setup (Complete Offline & LAN Guide)

`miniserve` is a single-file, zero-dependency executable web server written in Rust. It is ideal for shop-floor PCs or isolated environments without Node.js installed.

#### Step 1: Download `miniserve`
- Download the single executable for your OS from the official Releases page:
  - **Windows**: Download `miniserve-vX.Y.Z-x86_64-pc-windows-msvc.exe` and rename it to `miniserve.exe`.
  - **Linux**: Download `miniserve-vX.Y.Z-x86_64-unknown-linux-musl` and rename it to `miniserve`.
  - **macOS**: Download `miniserve-vX.Y.Z-x86_64-apple-darwin` (or ARM64).

#### Step 2: Prepare Folder Structure
Extract your `plmsys-local-web-app.zip` (or `dist` folder) so that `miniserve.exe` sits next to `index.html` and assets:
```
my-shopfloor-app/
├── assets/
│   ├── index-xxxx.js
│   └── index-xxxx.css
├── index.html
├── favicon.ico
└── miniserve.exe
```

#### Step 3: Run Miniserve
Open terminal / command prompt inside `my-shopfloor-app/` and run:

**Local-only access (Single PC):**
```cmd
miniserve.exe --spa --index index.html --port 8080 .
```

**Network / LAN access (Accessible by other factory tablet/PC devices):**
```cmd
miniserve.exe --spa --index index.html --port 8080 --interfaces 0.0.0.0 .
```

#### Explanation of Miniserve Flags:
| Flag | Description |
| --- | --- |
| `--spa` | Enables Single Page Application routing (routes all requests to `index.html`). |
| `--index index.html` | Specifies `index.html` as the default root entry point. |
| `--port 8080` | Sets the web port (default: 8080). Change to `--port 80` if running as administrator. |
| `--interfaces 0.0.0.0` | Binds to all network interfaces so other PCs on the factory network can open the app. |

#### Step 4: 1-Click Launch Script for Windows Operators (`run-app.bat`)
Create a text file named `run-app.bat` inside the app folder with the following content:
```bat
@echo off
title PLMSys Local Server (Miniserve)
echo Starting PLMSys Local Web Server...
echo Open http://localhost:8080 in your web browser.
miniserve.exe --spa --index index.html --port 8080 --interfaces 0.0.0.0 .
pause
```
Operators can simply double-click `run-app.bat` to launch the application server without typing commands.

---

### 5. Alternative Server Options (`npx serve`)
Using standard Node.js:
```bash
npx serve dist -s -p 8080
```

---

## 📖 How to Use the Application (User Guide)

### 1. User Roles & Default Passwords

- **Operator**: Standard production personnel capable of logging daily production cycles, viewing set statuses, and searching logs.
- **Admin / Supervisor**: Full administrative privileges including creating/deleting sets, configuring personnel, approving production logs, backing up/restoring databases, and conducting schema adjustments.

#### Default Credentials:
- **Admin Login Password**: `admin`
- **Supervisor Sign-off Passwords**: `admin`, `superadmin`, `supervisor` (or custom passwords configured in Personnel Management).

---

### 2. Navigation Overview

The top navigation bar provides instant access to primary operational views:
- **Dashboard**: High-level overview of active cylinder sets and status counters.
- **Set Monitoring**: Detailed breakdown of individual cylinder sets, plate positions, and installation statuses.
- **Daily Production**: Chronological log of shift production outputs and job orders.
- **Search**: Advanced keyword query tool for plate serial numbers, job orders, and dates.
- **Audit Logs**: Full operational event history.
- **Admin Center**: Database backups, factory reset controls, personnel configuration, and DB Studio.
- **New Set / Log Production**: Quick-action header buttons for common tasks.

---

### 3. Managing Cylinder Sets & Positions

1. Click **New Production Set** in the header or dashboard.
2. Enter the **Set Name** (e.g., `Set A - 8 Color Packaging`), **Number of Positions**, **Target Cycle Count**, and optional notes.
3. Click **Create Set**.
4. Open **Set Monitoring** to view the interactive grid of positions for that set.

---

### 4. Installing, Replacing & Removing Mold Plates

1. In **Set Monitoring**, select a position card (e.g., `Position 1`).
2. Click **Install Plate**:
   - Enter the **Plate Serial Number**.
   - Select the installing **Operator**.
   - Confirm installation date and initial cycle count.
3. **Record Plate Replacement**:
   - When a plate reaches wear limits or suffers damage, click **Replace Plate**.
   - Input the replacement reason and new plate serial number.
4. **Remove Plate**:
   - To remove a plate without immediate replacement, click **Remove Plate** and specify the removal code/reason.

---

### 5. Logging Daily Production Cycles

1. Click **Log Production** in the navigation bar.
2. Select the target **Cylinder Set**.
3. Enter the **Cycles Added** (e.g., `15,000` impressions).
4. Enter the **Job Order Number** (format: `0000-00`, e.g., `1042-01`).
5. Select the **Operator Name** and current shift date.
6. Enter a valid **Supervisor Password** for sign-off verification.
7. Click **Save Production Log**. The system will automatically update all installed plates on that set with the new cycle count.

---

### 6. Reviewing Daily Production & History

- Navigate to the **Daily Production** tab.
- View production records organized by date, job order, set name, and supervisor approvals.
- Filter by date range or specific set to analyze shift productivity and machine utilization.

---

### 7. Audit Trail & Search

- **Search**: Use the global search bar to locate specific plate serial numbers, job orders, operator names, or set names across the entire system.
- **Audit Log**: Open the **Audit Logs** tab to review time-stamped logs of all system activities, ensuring full traceability for quality audits.

---

### 8. Admin Dashboard, Backups & DB Studio

Click **Admin** in the top navigation bar and enter your Admin password (`admin`).

#### A. Backups & Restore
- **Export Backup**: Click **Export Backup** to download a complete `.json` database snapshot.
- **Import Backup**: Click **Import Backup** to restore data from a previously saved `.json` file.
- **Factory Reset**: Wipe all data and return to clean factory defaults (requires typing `RESET` to confirm).

#### B. DB & Schema Studio
- Click the **DB & Schema Studio** sub-tab inside Admin Dashboard.
- **Inspect Tables**: Select any IndexedDB table (`sets`, `positions`, `plates`, `plateInstallations`, `dailyProduction`, `auditLogs`, etc.) to view raw records.
- **Run Queries**: Search or filter raw database entries directly.
- **Modify Records**: Edit or clean up invalid records directly inside the browser DB studio.

---

## 📁 Project Architecture

```
plmsys/
├── .github/
│   └── workflows/
│       └── web-app-ci.yml    # CI verification & ZIP packaging workflow
├── src/
│   ├── components/           # UI views, modals, grids, and dashboards
│   │   ├── AdminDashboard.tsx
│   │   ├── DatabaseManagerView.tsx
│   │   ├── SetDetail.tsx
│   │   └── ...
│   ├── db/
│   │   └── db.ts             # IndexedDB / Dexie schema & seed data
│   ├── App.tsx               # Main application router & state controller
│   ├── main.tsx              # React entry point
│   ├── types.ts              # Global TypeScript interface declarations
│   └── utils.ts              # Helper & formatting utilities
├── index.html                # Main HTML entry point
├── server.ts                 # Production Express backend & Vite middleware
├── package.json              # Project dependencies & scripts
└── README.md                 # Project documentation & user guide
```

---

## 🛠 Troubleshooting & FAQs

### Q: Where is my data saved?
All data is stored locally in your browser's **IndexedDB** database (`PlateDatabase`). No data is ever uploaded to external servers.

### Q: Will clearing browser history delete my data?
Clearing standard history will NOT delete IndexedDB data. However, selecting **"Clear site data / cookies"** or clearing all site databases in browser developer settings will wipe the IndexedDB storage. **Always export a periodic JSON backup from the Admin Dashboard!**

### Q: Can I run this without internet access?
**Yes!** PLMSys is 100% self-contained. Once the production bundle is built or served locally, it requires zero internet connectivity.

### Q: How do I change the Admin Password?
You can update passwords and authorized personnel records via **Admin Dashboard** $\rightarrow$ **Personnel Management**, or directly in **DB & Schema Studio** under the `personnel` table.
