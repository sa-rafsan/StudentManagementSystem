# Edu Metrics Student Management System (SMS)

> A modern, professional, responsive Student Management System built strictly with **HTML5, plain CSS3, Vanilla JavaScript (ES6+), and Browser LocalStorage**.  
> **No backend, no server installation, and zero external frameworks required.**

---

## 🚀 Quick Run Guide

### 1. Run Server

Open terminal in the project directory and run:

```bash
python -m http.server 5500
```

> _(Alternative: Right-click `login.html` in VS Code > **"Open with Live Server"**, or double-click `login.html` to open directly)._

### 2. View in Web Browser

Open browser and visit: **[http://localhost:5500/login.html](http://localhost:5500/login.html)**

- **Admin:** `admin@example.com` / `Admin@123`
- **Teacher:** `teacher@example.com` / `Teacher@123`
- **Student:** `student@example.com` / `Student@123`
  _(One-click autofill buttons are also available on the login page)._

### 3. Stop Server

Press **`Ctrl + C`** in your terminal (or stop Live Server in VS Code).

---

## 📋 Project Overview

EduMetrics SMS is an enterprise-grade academic administration portal. It delivers complete student lifecycle management, dynamic analytics dashboards, department management, JSON data backup/restore, and client-side cryptographic authentication using the native **Web Crypto API**.

---

## 📁 Project Architecture & Folder Structure

```text
StudentManagementSystem/
├── index.html               # Page 1: Academic Dashboard & Analytics
├── login.html               # Authentication Login (with one-click demo autofill)
├── register.html            # User Registration (Role selection: Admin / Student)
├── students.html            # Page 2: Student Directory (CRUD, Search, Filter, Sort, Pagination)
├── add-student.html         # Page 3: Student Registration & Profile Editor Form
├── attendance.html          # Page 4: Classroom Attendance (Marking, Reports, Analytics)
├── student-details.html     # Page 5: Student Dossier Profile (Loaded via ?id=STU-...)
├── settings.html            # Page 6: Department Management & JSON Data Operations
│
├── assets/
│   ├── images/              # Image placeholders & assets
│   └── icons/               # SVG / vector assets
│
├── css/
│   ├── style.css            # Base styles, CSS variables, layout, modals, toasts
│   ├── dashboard.css        # Stat metric cards, charts container, department bars
│   ├── students.css         # Data table, filter toolbar, pagination, tags
│   ├── attendance.css       # Attendance tabs, roster pills, percentage meters
│   ├── forms.css            # Form grids, photo upload widget, validation feedback
│   ├── auth.css             # Authentication split-card layout
│   └── responsive.css       # Mobile drawer, tablet grids, print stylesheet
│
├── js/
│   ├── utils.js             # DOM helpers, XSS sanitization, modals, toast alerts
│   ├── storage.js           # LocalStorage wrapper, demo seeder, backup engine
│   ├── auth.js              # Web Crypto PBKDF2 hashing, sessions, route guard
│   ├── validation.js        # Form regular expressions, uniqueness checks
│   ├── student.js           # Student service: CRUD, search, filter, sort, paginate
│   ├── attendance.js        # Classroom Attendance: marking, calculations, reports
│   ├── dashboard.js         # Metric calculators, Chart.js & canvas fallbacks
│   ├── students.js          # Table controller, debounce search, pagination
│   ├── student-details.js   # Student dossier view from URL query param
│   ├── settings.js          # Department CRUD (foreign keys), JSON backup
│   └── app.js               # Global bootstrap, active links, mobile sidebar
│
├── database/
│   ├── schema.sql           # Formal MySQL 8.0+ schema (3 related tables, FKs)
│   └── er-diagram.md        # Logical ER diagram (Mermaid), cardinalities, dictionary
│
├── report/
│   └── project-report.md    # 10-section academic university project report
│
└── README.md                # Project documentation & operational manual
```

---

## 🛠️ Key Technical Features

### 1. Modern Dashboard (`index.html`)

- **Real-time Metrics:** Dynamically computes total students, active count, inactive count, and departments directly from LocalStorage.
- **Interactive Chart.js Visualizations:** Semester enrollment bar chart and gender demographic doughnut chart (includes automatic canvas fallback if offline).
- **Department Distribution:** Live progress bars illustrating student population percentages across academic faculties.

### 2. Complete Student CRUD & Directory (`students.html`)

- **Multi-Filter Engine:** Filter simultaneously by Department, Semester (1st-8th), and Status (Active/Inactive).
- **Debounced Search:** Instant search across student names, registration IDs, emails, and phone numbers.
- **Bi-directional Sorting:** Click any column header to sort ascending or descending.
- **Pagination:** Configurable page sizes (5, 10, 25, 50) with pagination controls.
- **Custom Modal Deletion:** Styled confirmation modal replacing primitive browser alerts.

### 3. Student Registration & Editor (`add-student.html`)

- **Dual Operation:** Seamlessly switches between "Add New Student" and "Edit Student" based on `?id=` query parameter.
- **Auto ID Generator:** Automatically creates formatted IDs (`STU-YYYY-NNN`).
- **Photo Processing:** Converts uploaded local image files into Base64 strings stored inside LocalStorage, complete with live preview and removal controls.
- **Strict Validation:** Regular expressions for email format, phone numbers, minimum age (>= 14 years), and duplicate email/ID prevention.

### 4. Student Dossier (`student-details.html`)

- Displays student profile photo, academic records, contact details, and dates.
- **Embedded Attendance Overview:** Live percentage meter, exam eligibility badge (`>= 75%`), class breakdown, and recent lecture logs.
- Dedicated **Print Dossier** button styled via print CSS media rules.

### 5. Classroom Attendance System (`attendance.html`)

- **Teacher Marking Mode:** Select Department, Semester, Date, and Subject to populate student roster.
- **Interactive Multi-Status Pills:** One-click toggles for `Present`, `Late`, `Absent`, and `Excused` with custom remarks.
- **Bulk Quick Actions:** "Mark All Present", "Mark All Absent", and live attendance percentage counters.
- **Student Reports & Analytics:** Automatic attendance rate calculation (`Present + Late / Total Sessions * 100%`).
- **Exam Eligibility Alerts:** Color-coded status badges:
  - 🟢 **Eligible** (`>= 75%`)
  - 🟡 **Warning** (`60% - 74%`)
  - 🔴 **Critical Shortage** (`< 60%`)
- **Detailed Lecture History Modal:** Date-by-date student timeline with teacher names and notes.
- **Session History Log:** Review, edit, or delete past lecture attendance sessions.

### 6. Settings & Data Operations (`settings.html`)

- **Department CRUD:** Create and edit departments with code and title.
- **Foreign Key Protection:** Prevents deleting a department if active students are assigned to it.
- **JSON Export:** Download a complete `.json` backup of all records.
- **JSON Import:** Upload and restore students from JSON with schema validation.
- **Reset / Purge:** Instant reset to default demo dataset or complete data wipe.

### 6. Security & Cryptography

- **Salted PBKDF2 Password Hashing:** Uses `window.crypto.subtle` with 100,000 iterations of SHA-256 and unique 16-byte random salts. Plaintext passwords are never persisted.
- **XSS Defense:** User-supplied content is safely rendered using `textContent` and `SMS.Utils.escapeHTML()`.

---

## 📊 Relational Database Design (`database/`)

A complete relational database design is provided in the repository:

- **`database/schema.sql`**: Formal MySQL DDL with 3 related tables (`departments`, `students`, `users`), foreign key constraints (`ON DELETE RESTRICT` and `ON DELETE SET NULL`), unique indices, and sample data.
- **`database/er-diagram.md`**: Logical Mermaid ER diagram illustrating `1:N` and `1:0..1` cardinalities, data dictionary, and an analysis explaining the boundary between server-side prepared statements and client-side execution.
