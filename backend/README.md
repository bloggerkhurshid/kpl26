# Khoraghat Premier League (KPL) - PHP + MySQL REST API Backend

Welcome to the **KPL PHP + MySQL Backend**. This folder provides a complete, high-performance REST API in PHP to replace or run alongside Supabase for hosting on standard web hosting servers (cPanel, Hostinger, XAMPP, Nginx, or Apache).

---

## 📁 Directory Structure

```
backend/
├── config/
│   ├── database.php        # PDO MySQL connection class
│   └── cors.php            # CORS headers & JSON helper
├── sql/
│   └── schema.sql          # Complete MySQL database import script
├── api/
│   ├── auth.php            # Admin authentication (login/verify)
│   ├── players.php         # Player registration, search, CRUD, & counts
│   ├── teams.php           # Franchise team management & squad limits
│   ├── highlights.php      # Highlights photo gallery CRUD
│   ├── content.php         # UI content toggles & texts
│   ├── settings.php        # Payment gateway & registration fee settings
│   ├── payments.php        # Payment transaction logs
│   └── dashboard.php       # Admin summary metrics & recent activities
├── uploads/                # Uploaded photos, documents, and proofs
├── .htaccess               # Apache rewrite rules & security headers
├── index.php               # API status page & health check
└── README.md               # Setup & deployment guide
```

---

## 🛠️ Step-by-Step Setup & Migration Guide

### Step 1: Create the MySQL Database
1. Open **phpMyAdmin** (cPanel / Hostinger / XAMPP).
2. Create a new database named `kpl_db` (or any custom database name).
3. Click on the **Import** tab.
4. Select `backend/sql/schema.sql` and click **Go**.
5. This creates all 7 tables (`teams`, `players`, `highlights`, `content_settings`, `payment_settings`, `payments`, `admin_users`) and inserts default settings & seed data.

---

### Step 2: Configure Database Credentials
Edit `backend/config/database.php` or create a file named `backend/config/env.php` with your database credentials:

```php
<?php
// backend/config/env.php
putenv("DB_HOST=localhost");
putenv("DB_NAME=kpl_db");
putenv("DB_USER=your_mysql_username");
putenv("DB_PASS=your_mysql_password");
putenv("DB_PORT=3306");
```

---

### Step 3: Test the PHP API
Start a local PHP server or navigate to your domain:

```bash
# Local PHP Server Test
php -S localhost:8000 -t backend
```

Open `http://localhost:8000/` in your browser. You should see a JSON status response confirming `connected: true`:

```json
{
  "name": "KPL Khoraghat Premier League REST API",
  "version": "1.0.0",
  "status": "online",
  "database": {
    "connected": true
  }
}
```

---

### Step 4: Next.js Frontend Integration
To connect your Next.js application (`kpl26.online`) to your new PHP API:

Add the following environment variable to `.env.local` or Vercel:

```env
NEXT_PUBLIC_PHP_API_URL=https://your-domain.com/backend
NEXT_PUBLIC_API_MODE=php
```

Or switch backend adapter via `lib/api.ts`.

---

## 🔐 Default Admin Credentials
- **Username**: `admin`
- **Password**: `password123`

---

## 📡 API Reference Endpoint Cheat-Sheet

| Action | HTTP Method | Endpoint |
|---|---|---|
| API Health Check | `GET` | `/backend/index.php` |
| Admin Login | `POST` | `/backend/api/auth.php` |
| List Players | `GET` | `/backend/api/players.php` |
| Player Count | `GET` | `/backend/api/players.php?count_only=true` |
| Register Player | `POST` | `/backend/api/players.php` |
| Update Player | `PUT` | `/backend/api/players.php?id={id}` |
| Delete Player | `DELETE` | `/backend/api/players.php?id={id}` |
| List Teams | `GET` | `/backend/api/teams.php` |
| Create Team | `POST` | `/backend/api/teams.php` |
| Update Team | `PUT` | `/backend/api/teams.php?id={id}` |
| List Gallery Highlights | `GET` | `/backend/api/highlights.php` |
| Create Highlight | `POST` | `/backend/api/highlights.php` |
| Content Settings | `GET / POST` | `/backend/api/content.php` |
| Registration Settings | `GET / POST` | `/backend/api/settings.php` |
| Dashboard Summary | `GET` | `/backend/api/dashboard.php` |
