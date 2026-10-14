# Backend setup

## Selected service

Supabase provides PostgreSQL, Auth, and private Storage. Both applications connect to the same project and share the same API implementation. No application server with a privileged database key is exposed to browsers.

## SQL Editor setup

1. Open project `vbsrwnjyiskbjangbohb` in your Supabase dashboard.
2. Confirm this is the intended project and back up existing data.
3. Open SQL Editor, create a query, paste the complete `supabase/setup.sql`, and run it.
4. Confirm that `profiles`, `requests`, `messages`, `activities`, and `attachments` exist with RLS enabled.
5. Confirm Storage contains `request-attachments`, with **Public disabled**, a 5 MiB limit, and PDF/PNG/JPEG allowed MIME types.
6. Configure Authentication URLs and email delivery.
7. Create test accounts and run the live verification suite.

The initial migration expects its table/type/function names to be unused. If you see an already-exists error, inspect the schema instead of deleting production objects. `setup.sql` and the migration must remain identical; choose one installation method, not both.

The profile trigger sets every new user to `customer`, regardless of metadata. Existing Auth users are backfilled as customers when the migration runs. Staff promotion is an administrative database operation.

## Manual test-account creation

No service-role key is required when using the dashboard.

In Authentication → Users → Add user, create these accounts with the same locally chosen test password (at least 12 characters) and confirm their email addresses:

| Email                    | Name         | Role     |
| ------------------------ | ------------ | -------- |
| customer@wasl.test       | Lina Hassan  | customer |
| other.customer@wasl.test | Mariam Ali   | customer |
| agent@wasl.test          | Omar Saleh   | agent    |
| agent.two@wasl.test      | Youssef Adel | agent    |
| manager@wasl.test        | Nadia Farouk | manager  |

Then run this SQL in the trusted dashboard SQL Editor:

```sql
update public.profiles p
set full_name = v.full_name, role = v.role::public.user_role
from auth.users u
join (values
  ('customer@wasl.test', 'Lina Hassan', 'customer'),
  ('other.customer@wasl.test', 'Mariam Ali', 'customer'),
  ('agent@wasl.test', 'Omar Saleh', 'agent'),
  ('agent.two@wasl.test', 'Youssef Adel', 'agent'),
  ('manager@wasl.test', 'Nadia Farouk', 'manager')
) as v(email, full_name, role) on u.email = v.email
where p.id = u.id;

select u.email, p.full_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
where u.email in (
  'customer@wasl.test',
  'other.customer@wasl.test',
  'agent@wasl.test',
  'agent.two@wasl.test',
  'manager@wasl.test'
);
```

Verify that five rows are returned. Staff promotion through a public registration form is intentionally impossible. Do not weaken RLS to make test data visible.

## Optional local account tool

Copy `.env.seed.example` to `.env.seed`, fill in your private admin key and chosen test password locally, then run `npm run users:seed`. A current Supabase secret admin key or legacy service-role key works with the administrative client. Never place either key in frontend configuration.

The script is repeatable for the five named test accounts. It resets their passwords and profile roles; it is not a general employee-provisioning service.

## Authentication URLs

For the combined preview:

- Site URL: `http://localhost:4173/customer/`
- Allowed redirects: `http://localhost:4173/customer/`, `http://localhost:4173/support/`
- Development URLs: `http://localhost:5173/customer/`, `http://localhost:4200/support/`

For deployment, add the corresponding HTTPS origins and paths. Public registration uses an email-confirmation flow; use real deliverable email addresses when registering through the UI. The `.test` accounts are created with confirmation already applied for local evaluation.

Configure your own SMTP provider and review rate limits before inviting real customers. Do not disable confirmation in production to work around an email-delivery problem.

## Optional Supabase CLI workflow

The repository is already initialized: **do not run `supabase init` again**.

For a project that has not received the SQL setup:

```bash
npx supabase login
npx supabase link --project-ref vbsrwnjyiskbjangbohb
npx supabase db push
```

Enter the database password interactively on your own computer. Do not commit access tokens, database connection passwords, or credential files.

If you already installed the migration using SQL Editor and later adopt CLI migrations, record that version without rerunning its SQL:

```bash
npx supabase migration repair --status applied 202610140001
npx supabase migration list
```

Only repair migration history after confirming the deployed schema exactly matches the migration. For changes after installation, add a new migration rather than editing an applied file.

The provided PostgreSQL URI contains `[YOUR-PASSWORD]`; it is a template, not a working connection string. Direct database credentials are not required by either frontend.

## Attachment permissions and failure cleanup

An authenticated user reserves attachment metadata through `reserve_attachment`. The server verifies request visibility, state, ownership, file metadata, and the attachment-count limit. Storage then accepts a new object only at the reserved, randomized path. `finish_attachment` verifies the stored size/type and rechecks request state and ownership before exposing the file.

Internal attachment rows and Storage objects remain inaccessible to customers. A failed upload is removed when possible before the reservation is canceled. Existing finalized files cannot be overwritten or deleted by browser users.

Inspect unfinished reservations from a trusted administrator session:

```sql
select id, request_id, storage_path, created_at
from public.attachments
where not ready and created_at < now() - interval '24 hours';
```

Verify that no upload is in progress. Remove corresponding objects through the Storage dashboard/API, then delete only the matching unfinished metadata rows through the SQL Editor. Do not delete Storage metadata directly; the Storage API must remove physical objects.

## Acceptance gate

After creating the accounts:

```bash
cp .env.live.example .env.live
npm run test:live
```

Fill in the chosen test password first. A live pass is required before treating the hosted integration as verified. The suite deliberately attempts unauthorized direct API operations and private-file downloads.
