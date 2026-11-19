# Pocket Planner

Pocket Planner is a budgeting app built as a Codecademy final project. It helps you plan monthly income, set spending allocations in euros, and keep track of recurring and upcoming expenses.

## Tech stack

- React for the interface and state
- Vite for local development and production builds
- JavaScript and CSS

## Current features

- Continue without an account through the sign-in placeholder.
- Switch between months and edit the income for each month.
- Set euro amounts for essential expenses, investments, entertainment and gifts, and education.
- Add, edit, or delete recurring and upcoming expenses, and see how they affect the monthly budget.
- Save budget and expense data in the current browser using local storage.

## Local setup

Install dependencies from the lockfile and start the development server.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To create a production build in `dist/`, run:

```sh
npm run build
```

## Planned integrations

- **Supabase** for account authentication and storage of account-specific budgets and expenses.
- **Zapier** for optional budget and expense automations.
