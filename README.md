# StudySync

CodePath WEB103 Final Project

Designed and developed by: Riya Affrin, Jadine Delfin, Alston Dsouza, Alex Schectman

🔗 Link to deployed app: https://web103-finalproject-xoeo.onrender.com/

## About

### Description and Purpose

StudySync is a student productivity web application designed to help students organize their coursework, manage assignment deadlines, track academic progress, and collaborate with teaching assistants.

The purpose of StudySync is to bring assignments, course information, and study plans together in one convenient platform. TAs can manage assignments and create study plans, while students can organize their work, prioritize tasks, and track their progress.

### Inspiration

As students, we know how challenging it can be to balance assignments, deadlines, classes, and personal responsibilities. With information spread across different platforms, it can be easy to lose track of important tasks or feel overwhelmed.

Our inspiration for this project comes from wanting to create a simple, organized space where students can manage their academic responsibilities more efficiently. We chose a student productivity app because it's a problem we can relate to personally, and we want to explore how technology can make everyday student life easier.

While many productivity tools already exist, our goal is to focus specifically on students by bringing assignment tracking, deadlines, and study goals together in an easy-to-use application. We want to prioritize simplicity and useful features rather than making the experience unnecessarily complicated.

## Tech Stack

**Frontend:** React 19, Vite 8, JavaScript, HTML, CSS

**Backend:** Node.js, Express 5

**Database:** PostgreSQL (`pg`)

**Testing:** Vitest, React Testing Library, Node.js built-in test runner

**Linting:** Oxlint

**Deployment:** Render

## Features

### Assignment Creation ✅

Addition of assignment objects replete with task, topic, grade, and deliverable data. TA only.

https://imgur.com/a/w9juX9G

### Course Tracking

Addition and linking of courses to assignments.

[gif goes here]

### Comments

Fields for marking and notating assignments and plans.

[gif goes here]


### Study Plan Creation

Addition of written, formatted study plans linked to specific courses and assignments.

[gif goes here]

### Topic Tagging

Additional field specifically for categorizing and associating courses, assignments, and plans.

[gif goes here]

### Triage System

Rankings for prioritization of assignments.

[gif goes here]

### Assignment Completion

Indicate submission or critical lapsing of assignment by clearing it from visible collections.

[gif goes here]

### Filtering

Selective limitation of visible assignments, courses, and plans in a given view.

[gif goes here]

## Installation Instructions

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/schectma/web103_finalproject.git
cd web103_finalproject
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure PostgreSQL

Create a local PostgreSQL database named `studysync_test`.

Create `server/.env`:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/studysync_test
PORT=3000
```

Replace the example credentials with your local PostgreSQL credentials.

### 4. Initialize the database

From the `server` directory, run:

```bash
ALLOW_DB_RESET=true npm run reset
```

**Warning:** This reset command drops existing tables. Only use it with a disposable local test database. Never run it against the shared Render database.

### 5. Start the backend

```bash
npm start
```

The backend runs on port 3000 by default.

### 6. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite.

### 7. Run tests

Frontend:

```bash
cd client
npm test
```

Backend:

```bash
cd server
npm test
```

Database-writing tests must use a disposable test database.

### Authentication

StudySync currently uses a simulated development user rather than a complete authentication system. The optional `VITE_CURRENT_USER_ID` environment variable selects a development user.
