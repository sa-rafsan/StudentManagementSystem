-- =============================================================================
-- UNIVERSITY STUDENT MANAGEMENT SYSTEM (EduMetrics SMS)
-- Relational Database Schema Specification (MySQL 8.0+)
-- =============================================================================
--
-- ACADEMIC NOTICE & ARCHITECTURAL MAPPING:
-- This application is implemented as a client-side architecture using Browser LocalStorage,
-- Vanilla JavaScript (ES6+), HTML5, and plain CSS3 for local execution without server overhead.
--
-- This schema.sql file provides the formal relational database design (DDL) required
-- for university coursework. It describes the relational structure, primary keys,
-- foreign keys, unique constraints, and indexes that correspond to the client-side
-- LocalStorage keys (sms_departments, sms_students, sms_users).
--
-- Prepared Statements Note:
-- Server-side prepared statements (PDO or MySQLi) are NOT implemented in this client-side
-- application because there is no PHP/Node.js/MySQL runtime backend. Client-side input
-- validation and HTML sanitization (textContent / escapeHTML) are used instead to prevent
-- Cross-Site Scripting (XSS).
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `student_management_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `student_management_db`;

-- -----------------------------------------------------------------------------
-- Table 1: departments
-- Maps to LocalStorage Key: `sms_departments`
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `department_id` VARCHAR(16) NOT NULL COMMENT 'Primary key (e.g. DEP-001)',
  `code` VARCHAR(10) NOT NULL COMMENT 'Short department code (e.g. CSE, EEE)',
  `name` VARCHAR(128) NOT NULL COMMENT 'Full faculty or department title',
  `head_of_department` VARCHAR(100) DEFAULT NULL COMMENT 'Chairperson / Dean name',
  `description` TEXT DEFAULT NULL COMMENT 'Curriculum scope and academic discipline',
  `created_at` DATE NOT NULL COMMENT 'Date established',
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uk_department_code` (`code`),
  UNIQUE KEY `uk_department_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table 2: students
-- Maps to LocalStorage Key: `sms_students`
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `student_id` VARCHAR(24) NOT NULL COMMENT 'Unique student registration ID (e.g. STU-2024-001)',
  `full_name` VARCHAR(100) NOT NULL COMMENT 'Student legal full name',
  `email` VARCHAR(128) NOT NULL COMMENT 'Unique university contact email',
  `phone` VARCHAR(32) NOT NULL COMMENT 'Contact telephone or mobile number',
  `date_of_birth` DATE NOT NULL COMMENT 'Date of birth (validated age >= 14)',
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL COMMENT 'Gender demographic',
  `department_id` VARCHAR(16) NOT NULL COMMENT 'Foreign key referencing departments',
  `semester` ENUM('1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th') NOT NULL COMMENT 'Current academic semester',
  `present_address` TEXT DEFAULT NULL COMMENT 'Residential address',
  `profile_photo` LONGTEXT DEFAULT NULL COMMENT 'Base64 image or photo URI',
  `enrollment_date` DATE NOT NULL COMMENT 'Date student was admitted',
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active' COMMENT 'Academic enrollment status',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Audit timestamp',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Modification timestamp',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `uk_student_email` (`email`),
  KEY `idx_student_department` (`department_id`),
  KEY `idx_student_status` (`status`),
  KEY `idx_student_name` (`full_name`),
  CONSTRAINT `fk_students_department`
    FOREIGN KEY (`department_id`)
    REFERENCES `departments` (`department_id`)
    ON UPDATE CASCADE
    ON DELETE RESTRICT -- Enforces referential integrity (cannot delete department with active students)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table 3: users
-- Maps to LocalStorage Key: `sms_users`
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` VARCHAR(24) NOT NULL COMMENT 'Internal user account ID (e.g. USR-001)',
  `name` VARCHAR(100) NOT NULL COMMENT 'Display username',
  `email` VARCHAR(128) NOT NULL COMMENT 'Login email identifier',
  `role` ENUM('Admin', 'Student') NOT NULL DEFAULT 'Student' COMMENT 'RBAC access authorization',
  `salt` VARCHAR(64) NOT NULL COMMENT 'Cryptographic salt (hex string for PBKDF2 derivation)',
  `password_hash` VARCHAR(128) NOT NULL COMMENT 'PBKDF2 SHA-256 derived key (hex string)',
  `student_id` VARCHAR(24) DEFAULT NULL COMMENT 'Foreign key to student profile if role=Student',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_user_email` (`email`),
  KEY `idx_user_student` (`student_id`),
  CONSTRAINT `fk_users_student`
    FOREIGN KEY (`student_id`)
    REFERENCES `students` (`student_id`)
    ON UPDATE CASCADE
    ON DELETE SET NULL -- If student is removed, keep the user account but nullify reference
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Data: Sample Departments
-- -----------------------------------------------------------------------------
INSERT INTO `departments` (`department_id`, `code`, `name`, `head_of_department`, `description`, `created_at`) VALUES
('DEP-001', 'CSE', 'Computer Science & Engineering', 'Dr. Alan Turing', 'Software engineering, algorithms, artificial intelligence, and network systems.', '2023-01-15'),
('DEP-002', 'EEE', 'Electrical & Electronic Engineering', 'Dr. Nikola Tesla', 'Micro-electronics, telecommunications, robotics, and power systems.', '2023-01-15'),
('DEP-003', 'BBA', 'Business Administration', 'Dr. Peter Drucker', 'Strategic management, financial markets, marketing, and leadership.', '2023-01-15'),
('DEP-004', 'ME', 'Mechanical Engineering', 'Dr. James Watt', 'Thermodynamics, automotive systems, advanced materials, and manufacturing.', '2023-01-15'),
('DEP-005', 'CE', 'Civil & Environmental Engineering', 'Dr. John Smeaton', 'Structural engineering, transportation design, hydrology, and urban planning.', '2023-01-15');

-- -----------------------------------------------------------------------------
-- Seed Data: Sample Students
-- -----------------------------------------------------------------------------
INSERT INTO `students` (`student_id`, `full_name`, `email`, `phone`, `date_of_birth`, `gender`, `department_id`, `semester`, `present_address`, `enrollment_date`, `status`, `created_at`) VALUES
('STU-2024-001', 'Sarah Jenkins', 'student@example.com', '+1 (555) 234-5678', '2003-04-15', 'Female', 'DEP-001', '4th', '742 Evergreen Terrace, Springfield, OR', '2023-09-01', 'Active', '2023-09-01 10:00:00'),
('STU-2024-002', 'Alexander Rivera', 'alex.rivera@example.com', '+1 (555) 345-6789', '2002-08-22', 'Male', 'DEP-001', '6th', '1204 Pine Hollow Road, Austin, TX', '2022-09-15', 'Active', '2022-09-15 11:20:00'),
('STU-2024-003', 'Priya Sharma', 'priya.sharma@example.com', '+1 (555) 456-7890', '2004-11-03', 'Female', 'DEP-002', '2nd', '88 Tech Boulevard, Cambridge, MA', '2024-01-10', 'Active', '2024-01-10 09:00:00'),
('STU-2024-004', 'David Kim', 'david.kim@example.com', '+1 (555) 567-8901', '2001-05-30', 'Male', 'DEP-003', '5th', '450 University Avenue, Palo Alto, CA', '2022-09-15', 'Active', '2022-09-15 14:45:00'),
('STU-2024-005', 'Amina Yusuf', 'amina.yusuf@example.com', '+1 (555) 678-9012', '2003-09-18', 'Female', 'DEP-004', '3rd', '312 Oakwood Drive, Columbus, OH', '2023-09-01', 'Active', '2023-09-01 13:10:00');

-- -----------------------------------------------------------------------------
-- Seed Data: Sample Demonstration Users
-- Admin Password: Admin@123 (PBKDF2 SHA-256 100,000 iterations)
-- Student Password: Student@123 (PBKDF2 SHA-256 100,000 iterations)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (`user_id`, `name`, `email`, `role`, `salt`, `password_hash`, `student_id`, `created_at`) VALUES
('USR-001', 'System Administrator', 'admin@example.com', 'Admin', '31323334353637383930616263646566', 'fb5c4ed67d45bce75dbe754b33a4e614f7636c407edd376fdd85439bd5803ac4', NULL, '2024-01-01 08:00:00'),
('USR-002', 'Sarah Jenkins', 'student@example.com', 'Student', '66656463626130393837363534333231', '73cdb97880fa64b56ef5887c7173fce65697e416a3ef64d2a7bc52122138c9f4', 'STU-2024-001', '2024-01-05 09:30:00');
