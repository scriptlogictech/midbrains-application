# Multi-Company CRM Client

React + Vite frontend for the Multi-Company Lead Management & Follow-up CRM.

## Setup

1. Copy `.env.example` to `.env`.
2. Set:
   `VITE_API_URL=http://localhost:5000/api`
3. Install:
   `npm install`
4. Start:
   `npm run dev`

## Backend expectation

The frontend expects the Node/Express API at `/api` with the routes already built in the CRM backend:

- `/auth/login`
- `/companies`
- `/companies/:companyId/stats`
- `/leads/:companyId`
- `/followups/today`
- `/admissions/company/:companyId`
- `/internships/company/:companyId`
- `/corporate-trainings/company/:companyId`
- `/projects/company/:companyId`
- `/placements/company/:companyId`
- `/reports/dashboard`
- `/reports/leads`
- `/reports/revenue`
- `/reports/placements`

The Add buttons and advanced CRUD forms are intentionally left for the next frontend implementation phase; this package restores the client application shell, routing, authentication, company dashboard, module listing, and reports integration in one package.