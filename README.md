# EduMetrics Student Management System (SMS)

> A modern, professional, responsive Student Management System built strictly with **HTML5, plain CSS3, Vanilla JavaScript (ES6+), and Browser LocalStorage**.  
> **No backend, no server installation, and zero external frameworks required.**

---

## 📋 Project Overview

EduMetrics SMS is an enterprise-grade academic administration portal suitable for university semester project submission and defense. It delivers complete student lifecycle management, dynamic analytics dashboards, departmental foreign key integrity, JSON data backup/restore, and client-side cryptographic authentication using the native **Web Crypto API**.

---

## 🚀 Quick Start Guide (Run Locally)

The application runs directly in any modern browser without installing Node.js, PHP, Python, Apache, or MySQL.

### Option A: Using VS Code Live Server (Recommended)
1. Open Visual Studio Code.
2. Click **File > Open Folder...** and select the `StudentManagementSystem` directory.
3. If not already installed, install the **Live Server** extension (by *Ritwick Dey*) from the VS Code Extensions marketplace.
4. Right-click on `index.html` or `login.html` and click **"Open with Live Server"**.
5. The application will immediately launch at `http://127.0.0.1:5500/login.html` or `http://127.0.0.1:5500/index.html`.

### Option B: Direct Browser Launch
1. Navigate to the `StudentManagementSystem/` folder in your file explorer.
2. Double-click `login.html` or `index.html` to open it in Chrome, Edge, Firefox, or Safari.

---

## 🔐 Demonstration Login Credentials

The system includes pre-seeded demonstration accounts. On the `login.html` page, click either of the **One-Click Autofill** buttons or use the credentials below:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@example.com` | `Admin@123` | Full CRUD operations, department management, system settings, JSON backup/restore. |
| **Student** | `student@example.com` | `Student@123` | Student dashboard view, student profile dossier, read-only directory access. |

> **⚠️ Academic Demonstration Notice:** Browser-based authentication, PBKDF2 hashing, and client-side role checks are implemented for educational demonstration purposes. They are not equivalent to production server-side authentication, HTTP-only secure cookies, or backend prepared statements.

---

## 📁 Project Architecture & Folder Structure

```text
StudentManagementSystem/
├── index.html               # Page 1: Academic Dashboard & Analytics
├── login.html               # Authentication Login (with one-click demo autofill)
├── register.html            # User Registration (Role selection: Admin / Student)
├── students.html            # Page 2: Student Directory (CRUD, Search, Filter, Sort, Pagination)
├── add-student.html         # Page 3: Student Registration & Profile Editor Form
├── student-details.html     # Page 4: Student Dossier Profile (Loaded via ?id=STU-...)
├── settings.html            # Page 5: Department Management & JSON Data Operations
│
├── assets/
│   ├── images/              # Image placeholders & assets
│   └── icons/               # SVG / vector assets
│
├── css/
│   ├── style.css            # Base styles, CSS variables, layout, modals, toasts
│   ├── dashboard.css        # Stat metric cards, charts container, department bars
│   ├── students.css         # Data table, filter toolbar, pagination, tags
│   ├── forms.css            # Form grids, photo upload widget, validation feedback
│   ├── auth.css             # Authentication split-card layout & disclaimer banner
│   └── responsive.css       # Mobile drawer, tablet grids, print stylesheet
│
├── js/
│   ├── utils.js             # DOM helpers, XSS sanitization, modals, toast alerts
│   ├── storage.js           # LocalStorage wrapper, demo seeder, backup engine
│   ├── auth.js              # Web Crypto PBKDF2 hashing, sessions, route guard
│   ├── validation.js        # Form regular expressions, uniqueness checks
│   ├── student.js           # Student service: CRUD, search, filter, sort, paginate
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
* **Real-time Metrics:** Dynamically computes total students, active count, inactive count, and departments directly from LocalStorage.
* **Interactive Chart.js Visualizations:** Semester enrollment bar chart and gender demographic doughnut chart (includes automatic canvas fallback if offline).
* **Department Distribution:** Live progress bars illustrating student population percentages across academic faculties.

### 2. Complete Student CRUD & Directory (`students.html`)
* **Multi-Filter Engine:** Filter simultaneously by Department, Semester (1st-8th), and Status (Active/Inactive).
* **Debounced Search:** Instant search across student names, registration IDs, emails, and phone numbers.
* **Bi-directional Sorting:** Click any column header to sort ascending or descending.
* **Pagination:** Configurable page sizes (5, 10, 25, 50) with pagination controls.
* **Custom Modal Deletion:** Styled confirmation modal replacing primitive browser alerts.

### 3. Student Registration & Editor (`add-student.html`)
* **Dual Operation:** Seamlessly switches between "Add New Student" and "Edit Student" based on `?id=` query parameter.
* **Auto ID Generator:** Automatically creates formatted IDs (`STU-YYYY-NNN`).
* **Photo Processing:** Converts uploaded local image files into Base64 strings stored inside LocalStorage, complete with live preview and removal controls.
* **Strict Validation:** Regular expressions for email format, phone numbers, minimum age (>= 14 years), and duplicate email/ID prevention.

### 4. Student Dossier (`student-details.html`)
* Displays student profile photo, academic records, contact details, and dates.
* Dedicated **Print Dossier** button styled via print CSS media rules.

### 5. Settings & Referential Integrity (`settings.html`)
* **Department CRUD:** Create and edit departments with code and title.
* **Foreign Key Protection:** Prevents deleting a department if active students are assigned to it.
* **JSON Export:** Download a complete `.json` backup of all records.
* **JSON Import:** Upload and restore students from JSON with schema validation.
* **Reset / Purge:** Instant reset to default demo dataset or complete data wipe.

### 6. Security & Cryptography
* **Salted PBKDF2 Password Hashing:** Uses `window.crypto.subtle` with 100,000 iterations of SHA-256 and unique 16-byte random salts. Plaintext passwords are never persisted.
* **XSS Defense:** User-supplied content is safely rendered using `textContent` and `SMS.Utils.escapeHTML()`.

---

## 📊 Relational Database Design (`database/`)

While the application executes entirely within browser LocalStorage for portability, a complete relational database design is provided for academic evaluation:
* **`database/schema.sql`**: Formal MySQL DDL with 3 related tables (`departments`, `students`, `users`), foreign key constraints (`ON DELETE RESTRICT` and `ON DELETE SET NULL`), unique indices, and sample data.
* **`database/er-diagram.md`**: Logical Mermaid ER diagram illustrating `1:N` and `1:0..1` cardinalities, data dictionary, and an analysis explaining the boundary between server-side prepared statements and client-side execution.

---

## 🎓 Academic Integrity Notice

* **Prepared Statements:** Server-side prepared statements (PDO or MySQLi) are not implemented in this application because it operates without a PHP, Node.js, or MySQL backend server. Client-side input validation and HTML entity escaping are used to prevent script injection.
* **Coursework Ready:** Designed for evaluation under university Web Application Development and Software Engineering courses.
