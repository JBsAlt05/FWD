# FWD – Fix Wave Direct Management System

## Project Overview
**FWD (Fix Wave Direct)** is a web-based facility work order management system designed to streamline the creation, assignment, tracking, and monitoring of maintenance work orders across multiple roles.

The system supports **role-based access control**, allowing different users (Admin, Dispatcher, Team Leader) to interact with the system according to their responsibilities. This project was developed as an academic full-stack application.

---

## Features
- Session-based authentication (login/logout)
- Role-based access control
- Work order creation and assignment
- Status, ETA, and NTE tracking
- Dispatcher-specific work order views
- Technician management
- Notes and attachments per work order
- MySQL relational database

---

## User Roles

### Admin
- Create and manage work orders
- Assign work orders to dispatchers
- Edit work order details (status, NTE, ETA)
- View all work orders
- Manage technicians

### Dispatcher
- View only assigned work orders
- Track and update assigned jobs

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- Fetch API

### Backend
- Node.js
- Express.js
- express-session (session-based authentication)

### Database
- MySQL
- phpMyAdmin (local management)

---

## Project Structure
```
FWD/
├── backend/
│   ├── routes/
│   ├── uploads/
│   ├── db.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── *.html
│   └── styles.css
├── database/
│   └── fwd.sql
└── README.md
```

---

## Database Design
The database is provided as an SQL dump file that includes both the schema and sample data.

### Main Tables
- roles
- users
- clients
- stores
- technicians
- work_orders
- notes
- files

Relationships are enforced using foreign keys to maintain data integrity.

---

## Database Setup

### Using phpMyAdmin
1. Start **XAMPP** (Apache + MySQL)
2. Open http://localhost/phpmyadmin
3. Create a database named `fwd`
4. Import `database/fwd.sql`

### Using MySQL Command Line
```sql
CREATE DATABASE fwd;
USE fwd;
SOURCE database/fwd.sql;
```

---

## Backend Setup
```bash
cd backend
npm install
node server.js
```

Backend runs on `http://localhost:3001`

---

## Frontend Usage
- Open `frontend/login.html` in a browser
- Log in using database credentials
- User is redirected based on role

---

## Authentication & Security
- Session-based authentication using express-session
- User role stored in session
- Protected routes prevent unauthorized access

---

## Future Improvements
- Password hashing (bcrypt)
- Input validation
- Filtering
- Environment variables
- UI improvements

---