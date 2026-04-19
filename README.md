# MedLab DBS

A Next.js web front-end for a MySQL relational database that manages the full diagnostic workflow of a private clinic.

## Context

This is Homework 3 for the Databases course at Ukrainian Catholic University (PKN 24/B, Variant 07, domain: Medical Test).

The app is a web-based front-end for a MySQL database that manages the diagnostic workflow of a private clinic: patient registration, test ordering, specimen collection, result entry, and lab report generation.

## Tech Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- MySQL 8.0 via mysql2/promise
- JetBrains DataGrip (for DB management)

## Database Schema

```
PATIENT         patient_id (PK), first_name, last_name, date_of_birth, gender, phone, email, address
MEDICAL_STAFF   staff_id (PK), first_name, last_name, role, department, phone, email
TEST_DEFINITION test_def_id (PK), test_name, test_code, category, normal_range, unit, description
TEST_ORDER      order_id (PK), patient_id (FK), staff_id (FK), test_def_id (FK), order_date, priority, status, notes, cancellation_reason
SPECIMEN        specimen_id (PK), order_id (FK), specimen_type, collection_date, collected_by (FK), storage_temp, barcode, rejection_reason, status
LAB_REPORT      report_id (PK), specimen_id (FK), reviewed_by (FK), report_date, overall_status, comments, is_amended, amendment_note
RESULT_ITEM     report_id (FK) + item_seq_no (composite PK), test_def_id (FK), measured_value, text_result, flag
```

The FK cascade chain runs PATIENT -> TEST_ORDER -> SPECIMEN -> LAB_REPORT -> RESULT_ITEM, so deleting a patient automatically removes all downstream records via ON DELETE CASCADE.

## Prerequisites

- Node.js 20+
- MySQL 8.0 running locally
- Database `medical_test_v07` created and populated (see HW3 report Step 6)

## Setup

### Clone / navigate

```bash
cd ~/Documents/DB/hw3/db-hw3
```

### Install dependencies

```bash
npm install
```

### Environment variables

Create `.env.local` in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medical_test_v07
```

### Run in development

```bash
npm run dev
```

Open http://localhost:3000

### Build for production

```bash
npm run build
npm start
```

## Application Pages

| Route | Description |
|---|---|
| `/` | Dashboard — row counts for all 7 tables |
| `/patients/new` | Form 1 — Register a new patient (INSERT PATIENT) |
| `/orders/new` | Form 2 — Create a test order (INSERT TEST_ORDER) |
| `/orders/cancel` | Form 3 — Cancel a test order (UPDATE status + cancellation_reason) |
| `/specimens/status` | Form 4 — Update specimen status and rejection reason (UPDATE SPECIMEN) |
| `/patients/delete` | Form 5 — Delete a patient with full cascade preview (DELETE PATIENT) |

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/patients` | Insert a new patient row |
| GET | `/api/patients/[id]` | Fetch a single patient and their order count (used for cascade preview) |
| DELETE | `/api/patients/[id]` | Delete patient and all child records via ON DELETE CASCADE |
| POST | `/api/orders` | Insert a new test order with FK validation |
| GET | `/api/orders` | List active (non-cancelled) orders for the cancel-form dropdown |
| PATCH | `/api/orders/[id]/cancel` | Set order status to CANCELLED and store cancellation_reason |
| PATCH | `/api/specimens/[id]/status` | Update specimen status; set or clear rejection_reason |
| GET | `/api/patients/dropdown` | List all patients (id, first_name, last_name) for form dropdowns |
| GET | `/api/staff/dropdown` | List all Doctors (id, name, role) for form dropdowns |
| GET | `/api/tests/dropdown` | List all test definitions (id, name, code, category) for form dropdowns |
| GET | `/api/specimens/dropdown` | List all specimens (id, barcode, type, status) for form dropdowns |

## Data Integrity Notes

- Required fields are validated server-side before any SQL is issued.
- FK existence is checked with pre-SELECT queries before each INSERT.
- ENUM values (gender, priority, specimen status) are validated against closed sets in the API routes.
- ON DELETE CASCADE handles multi-table deletion automatically when a patient is removed.
- `rejection_reason` is set to NULL when specimen status is not REJECTED.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── orders/
│   │   │   ├── [id]/
│   │   │   │   └── cancel/
│   │   │   │       └── route.ts
│   │   │   └── route.ts
│   │   ├── patients/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   ├── dropdown/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── specimens/
│   │   │   ├── [id]/
│   │   │   │   └── status/
│   │   │   │       └── route.ts
│   │   │   └── dropdown/
│   │   │       └── route.ts
│   │   ├── staff/
│   │   │   └── dropdown/
│   │   │       └── route.ts
│   │   └── tests/
│   │       └── dropdown/
│   │           └── route.ts
│   ├── orders/
│   │   ├── cancel/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── patients/
│   │   ├── delete/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── specimens/
│   │   └── status/
│   │       └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── NavBar.tsx
└── lib/
    └── db.ts
```
