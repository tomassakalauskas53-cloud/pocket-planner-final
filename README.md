# Pocket Planner

Pocket Planner is a budgeting app built as a Codecademy final project. It helps you plan monthly income, set spending allocations in euros, and keep track of recurring and upcoming expenses.

## Tech stack

- React for the interface and state
- Vite for local development and production builds
- JavaScript and CSS

## Current features

- Register and sign in with an email address and password using Supabase Auth. The app restores the session after a reload.
- Switch between months and edit the income for each month.
- Set euro amounts for essential expenses, investments, entertainment and gifts, and education.
- Add, edit, or delete recurring and upcoming expenses, and see how they affect the monthly budget.
- Save budget and expense data in the current browser using local storage.

## Local setup

Copy `.env.example` to `.env.local` in the project root. Set `VITE_SUPABASE_URL` to your Supabase project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to your project's publishable key. Enable the Email provider and add the Vite app URL to the project's Auth redirect allow list if email confirmation is enabled.

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

- **Supabase** for storage of account-specific budgets and expenses.
- **Zapier** for optional budget and expense automations.
## Live application

https://pocket-planner-phi.vercel.app/

## Project overview

Pocket Planner is a personal budgeting application that helps users manage monthly budgets, spending categories, and recurring or upcoming expenses.

The project was developed using React, Vite, JavaScript, and Supabase Authentication.

## Database and automation

The Supabase project contains two related tables:

- `budgets` – monthly budget information.
- `expenses` – expense records.

The automation workflow is configured as follows:

1. A new expense is inserted into Supabase.
2. A database trigger sends a webhook to Zapier.
3. Zapier filters events using `expense.created`.
4. Paths separates expenses into `big` and `small`.
5. The workflow includes Notion and Gmail actions.

**Automation status:** Webhook, Filter, and Notion action tests have succeeded. The Zap is currently a draft because publishing Webhooks and Paths requires a paid Zapier plan. End-to-end email delivery has not yet been verified.

## Environment variables

The application uses the following environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Actual values and secret credentials must not be committed to GitHub.

## Testing

The following functionality has been tested:

- User registration and login.
- Creating expenses through the application.
- Receiving an expense event in Zapier.
- Filtering the `expense.created` event.
- Creating a test record in Notion.

Additional verification is required for user-specific database isolation, live automation execution, and Gmail delivery.
