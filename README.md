# Pennywise — Syntecxhub Web Development Internship Project

A responsive React expense tracker built to match the requirements in the Syntecxhub “Web Development Week 1 Task” PDF.

## Features

- Add, edit and delete income/expense transactions
- Required-field and positive-amount validation
- Monthly overview: income, expenses, net balance and savings rate
- Spending-by-category donut chart and monthly budget indicator
- Search, month picker, transaction-type and category filters
- CSV export of the currently filtered transaction list
- Responsive layout for desktop, tablet and mobile
- Fetches starter transactions from `public/mock-expenses.json` with `useEffect`
- Persists transaction changes in browser `localStorage`
- `useState`: forms, transactions, search and filter state
- `useEffect`: fetch initial mock API data and persist changes
- `useRef`: focus the title/amount inputs and clear toast timer on unmount
- `useMemo`: derived totals, filtered rows, category breakdown and weekly chart data
- `useCallback`: stable handlers passed to child transaction rows
- Accessible labels, focus styles, dialog semantics, empty/loading/error states

## Tech stack

- React + Vite
- JavaScript (ES modules)
- CSS (responsive, no UI framework)
- Lucide React icons
- Local JSON mock API; browser localStorage for persistence

## Run locally

Requirements: Node.js 18+ recommended.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Project structure

```text
syntecxhub-expense-tracker/
├── public/
│   └── mock-expenses.json
├── src/
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── README.md
```

## Before submission

1. Run the app and test add/edit/delete, filters, month picker, budget, and CSV export.
2. Replace sample records with your own test data if you want.
3. Create a GitHub repository named `Syntecxhub_Expense_Tracker` (as suggested by the internship PDF naming pattern).
4. Push the source code and submit the repository link through the official submission form.
5. Be prepared to explain the five React hooks used and how local JSON fetching and localStorage persistence work.

## Notes

- This is a front-end internship project, not a banking application. It has no authentication or backend database.
- Transactions are saved only in the current browser profile. Clearing browser site data removes them.
- Starter records are demo data and can be deleted. Amounts are formatted in Indian rupees.
- The task PDF requires a mock API fetch and React hooks; it does not specify a real backend or real bank integration.
