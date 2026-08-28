# Plate Lifecycle Monitoring System (PLMSys) - PHP 8 Backend

This is the production-ready PHP 8 REST API backend for the Plate Lifecycle Monitoring System with support for both **MySQL 8** and **PostgreSQL 14+**.

---

## 🛠️ Requirements

- **PHP**: 8.0, 8.1, 8.2, or 8.3 with `pdo`, `pdo_mysql`, `pdo_pgsql`, `json` extensions.
- **Database**: MySQL 8.0+ / MariaDB 10.5+ OR PostgreSQL 14+.
- **Web Server**: Apache / Nginx / Caddy / XAMPP / WAMP or PHP built-in CLI server.

---

## 🚀 Quick Start (PHP Built-in Server)

1. **Import Database Schema**:
   - For **MySQL**: Execute `sql/mysql_schema.sql` on your MySQL server.
   - For **PostgreSQL**: Execute `sql/postgres_schema.sql` on your PostgreSQL server.

2. **Configure Environment**:
   Set environment variables or edit `config.php`:
   ```bash
   export DB_DRIVER=mysql       # or 'pgsql'
   export DB_HOST=127.0.0.1
   export DB_PORT=3306          # 5432 for postgres
   export DB_NAME=plm_system
   export DB_USER=root
   export DB_PASS=your_password
   ```

3. **Start the API Server**:
   ```bash
   php -S 0.0.0.0:8000 -t backend/
   ```

4. **Verify Health**:
   Visit `http://localhost:8000/` or `http://localhost:8000/health`.

---

## 🐳 Docker Deployment (1-Command Run)

Run PHP 8 + MySQL 8 + PostgreSQL with Docker Compose:

```bash
docker-compose up -d
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server & PHP status |
| `GET` | `/db/status` | Database connection diagnostics |
| `GET` | `/db/export/mysql` | Download live MySQL .sql dump |
| `GET` | `/db/export/postgres`| Download live PostgreSQL .sql dump |
| `POST`| `/db/query` | Run custom SQL query |
| `GET` | `/sets` | List all monitored plate sets |
| `POST`| `/sets` | Create new set with 11 positions |
| `GET` | `/positions` | List all 11 position slots per set |
| `GET` | `/plates` | List plate records & lifecycle states |
| `POST`| `/plates/install` | Install plate onto set position |
| `POST`| `/plates/remove` | Log plate removal, reject, or retirement |
| `GET` | `/production` | List daily production logs |
| `POST`| `/production` | Log daily cycles and increment set count |
| `GET` | `/job-orders` | List production job orders |
| `GET` | `/audit-logs` | Retrieve tamper-evident audit logs |
| `POST`| `/auth/login` | Operator & Admin authentication |
