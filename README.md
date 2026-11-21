
# Pocket Planner

Pocket Planner is a personal budgeting web application developed as a CodeAcademy final project. It helps users manage monthly income, allocate spending across categories, and track recurring and upcoming expenses.

## Live application

https://pocket-planner-final.vercel.app/

## Tech stack

- React – user interface and application state
- Vite – development and production builds
- JavaScript and CSS – application logic and styling
- Supabase Auth – user authentication
- Supabase PostgreSQL – database
- GitHub – version control
- Vercel – production deployment
- Zapier – workflow automation
- Notion – automated expense event logging
- Gmail – large expense notifications

## Current features

- User registration and login using Supabase Auth.
- Session restoration after a page reload.
- Monthly income and budget management.
- Budget allocations for essential expenses, investments, entertainment and gifts, and education.
- Creation, editing, and deletion of recurring and upcoming expenses.
- Account-specific budget and expense storage in Supabase.
- Expense classification into big and small expenses.
- Automated expense event logging in Notion.
- Email notifications for large expenses.

## Database

The Supabase database contains two related tables:

- `budgets` – monthly income and budget allocations.
- `expenses` – recurring and upcoming expense records.

Both tables are associated with authenticated users.

Monetary values are stored as integer cents in the database and displayed as euros in the application.

## Authentication and security

The application uses Supabase Authentication.

Row Level Security (RLS) is enabled on both database tables:

- `own_budgets`
- `own_expenses`

Access is restricted using the authenticated user's ID:

`auth.uid() = user_id`

A practical test with two separate user accounts confirmed that one account did not display the other account's expenses.

The Zapier webhook URL and authorized test user ID are stored securely in Supabase Vault.

## Automation workflow

The automation is triggered when a new expense is inserted into the Supabase database by the authorized test user.

1. The user creates an expense in Pocket Planner.
2. The expense is saved in Supabase.
3. An AFTER INSERT database trigger sends a webhook request to Zapier.
4. Zapier receives the request using Catch Hook.
5. Filter by Zapier allows only `expense.created` events.
6. Zapier Paths routes the event according to its size.

### Path A – Big Expenses

- Condition: `size = big`
- Create an expense event record in Notion.
- Send an email notification through Gmail.

### Path B – Small Expenses

- Condition: `size = small`
- Create an expense event record in Notion.
- No email notification is sent.

### Webhook payload

The webhook transfers only the following fields:

- `event`
- `event_id`
- `size`

Expense amounts and personal user information are not included in the webhook payload.

## Automation status

The Zapier workflow is published and has been successfully tested using real expense events created through the deployed application.

Both automation paths completed successfully.

## Testing

Testing completed on November 21, 2026.

| Test | Result |
|---|---|
| User registration | Passed |
| User login | Passed |
| Income storage | Passed |
| Expense storage | Passed |
| User data isolation | Passed |
| Supabase webhook delivery | Passed |
| Zapier event filtering | Passed |
| Big expense automation | Passed |
| Small expense automation | Passed |
| Notion integration | Passed |
| Gmail notification | Passed |

### End-to-end automation tests

| Amount | Classification | Actions | Status |
|---|---|---|---|
| 150 EUR | big | Notion + Gmail | Successful |
| 25 EUR | small | Notion | Successful |

Both successful executions were recorded in Zapier History.

## Local setup

Clone the GitHub repository:

```bash
git clone https://github.com/tomassakalauskas53-cloud/pocket-planner-final.git
cd pocket-planner-final
```

Install dependencies:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and configure the following environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Enable the Email authentication provider in Supabase and configure the appropriate authentication redirect URLs.

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Secret credentials and private configuration values must not be committed to GitHub.

## Version control and deployment

The project uses GitHub for version control and includes three merged Pull Requests covering:

1. Supabase authentication.
2. Supabase budget and expense storage.
3. Project documentation.

The application is deployed to Vercel and connected to the GitHub repository.

## Project documentation

Additional project documentation is maintained in Notion under:

Pocket Planner – Final Project Documentation

The documentation includes:

- Project objectives
- System architecture
- Implementation checklist
- Technical decisions and reasoning
- Error logs and solutions
- Testing results
- Screenshots and implementation evidence

## Known limitations

- Zapier automation currently uses a 14-day Professional trial.
- Continued automation may require a paid Zapier subscription.
- Webhook delivery is restricted to one authorized test user.
- Notion records expense event information and classification rather than actual financial amounts.

## Conclusion

Pocket Planner demonstrates the integration of frontend development, authentication, relational databases, security policies, version control, cloud deployment, and workflow automation.

The deployed application and both expense automation paths have been successfully tested.
