# Admin Dashboard Setup — Beginner Guide

You do **not** need to install a program or write backend code. Plan on about 15–20 minutes. This guide connects the static website to **Supabase**, which stores the reports and securely verifies your admin email and password.

## Before you begin

Have these ready:

- Access to this GitHub repository.
- An email address you will use to sign in as the administrator.
- A new, strong password. **Do not type this password into any repository file.** It belongs only in Supabase and on the admin sign-in screen.

There are three pieces involved:

1. `index.html` sends visit and lineup reports.
2. Supabase securely stores those reports and checks the login.
3. `admin.html` shows the reports only after an allowlisted administrator signs in.

## Step 1: Create the Supabase project

1. Visit [supabase.com](https://supabase.com/) and choose **Start your project**.
2. Sign in (using GitHub is fine), then choose **New project**.
3. If prompted, create or select an organization.
4. Enter a project name such as `kickball-admin`.
5. Let Supabase generate a database password, and save it in a password manager. This is the **database password**, not the admin website password. You will probably not need it during this setup.
6. Pick the region nearest you and choose **Create new project**.
7. Wait until the project dashboard finishes preparing the database.

Keep this browser tab open.

## Step 2: Create your admin login

1. In the Supabase left sidebar, open **Authentication**, then **Users**.
2. Choose **Add user** → **Create new user**. Do not choose an anonymous user.
3. Enter the email address and password you want to use on the admin page.
4. Turn on **Auto Confirm User** if that choice is shown, then create the user.
5. In the Users table, click the new user and copy their **User UID**. It looks similar to `12345678-abcd-1234-abcd-1234567890ab`.
6. Paste that UID into a temporary note. You will use it in Step 4; it is not a password.

## Step 3: Create the reporting database

1. In this repository, open [`supabase-admin.sql`](supabase-admin.sql).
2. Choose **Raw**, then copy the entire file.
3. Return to Supabase and open **SQL Editor** in the left sidebar.
4. Choose **New query**, paste the copied SQL, and press **Run**.
5. A success message should appear. The script is safe to run again if you accidentally run it twice.

This creates three tables:

- `visitor_events` contains page visits, including the requesting IP address.
- `roster_snapshots` contains the latest submitted roster/lineup data.
- `admin_users` is the allowlist of people permitted to read the first two tables.

It also turns on Row Level Security. Visitors can submit reports but cannot read everybody else's data.

## Step 4: Allow your admin user to see reports

In the same Supabase SQL Editor, replace `PASTE-USER-UID-HERE` below with the User UID copied in Step 2. Keep the single quotation marks.

```sql
insert into public.admin_users (user_id)
values ('PASTE-USER-UID-HERE')
on conflict (user_id) do nothing;
```

For example, the finished query will look like this:

```sql
insert into public.admin_users (user_id)
values ('12345678-abcd-1234-abcd-1234567890ab')
on conflict (user_id) do nothing;
```

Press **Run**. A success response means this user is now an approved administrator. Creating a Supabase user without completing this step does **not** give that user access to the reports.

## Optional: apply future SQL changes automatically

The repository includes a GitHub Actions workflow that runs `supabase-admin.sql` whenever that file changes on the `main` branch. To enable it:

1. In Supabase, open **Connect**, select a direct connection or session-pooler connection, and copy its PostgreSQL connection string. Replace the password placeholder with your project database password.
2. In GitHub, open **Settings** → **Secrets and variables** → **Actions**.
3. Create a repository secret named `SUPABASE_DB_URL` and paste the complete connection string as its value.
4. In GitHub, open **Settings** → **Environments**, create an environment named `production`, and optionally add a required reviewer if you want approval before database changes run.
5. Open the repository's **Actions** tab and run **Apply Supabase admin schema** once with **Run workflow** to verify the connection.

After setup, a push to `main` that changes `supabase-admin.sql` automatically applies the complete script. The workflow stops at the first SQL error. The connection string contains a database password, so never put it in `admin-config.js`, a workflow file, or any other committed file. Rotate the database password immediately if the connection string is exposed.

## Step 5: Copy the two public connection values

1. In Supabase, open **Project Settings** (the gear icon), then **API**. In newer dashboard layouts this may be called **Data API** or **API Keys**.
2. Find and copy the **Project URL**. It resembles `https://abcdefghijk.supabase.co`.
3. Find and copy the **anon public** key or **publishable** key. It is a long string.
4. **Never use or copy the `service_role` or secret key into this website.** That key bypasses security rules.

The project URL and anon/publishable key are expected to appear in a public website. The database rules from Step 3 are what limit what that key can do.

## Step 6: Put those values into the website

1. In GitHub, open [`admin-config.js`](admin-config.js) and click the pencil icon to edit it.
2. Replace only the two empty values. Preserve the quotation marks and comma:

```js
window.KICKBALL_ADMIN_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-OR-PUBLISHABLE-KEY"
};
```

3. Choose **Commit changes**, enter a message such as `Configure admin reporting`, and commit to the branch that GitHub Pages publishes.
4. Wait a minute or two for GitHub Pages to redeploy.

Do not put the admin email, admin password, database password, or Supabase secret/service-role key in this file.

## Step 7: Test the complete setup

1. Open the normal lineup builder in a private/incognito browser window.
2. Create a test team, add a player, and make a game lineup. Changes are sent automatically after a short delay.
3. Close the private window.
4. Go directly to your website's admin address. For example:

   ```text
   https://YOUR-WEBSITE.com/admin.html
   ```

5. Sign in with the **admin email and admin website password** created in Step 2.
6. You should see at least one visit, one visitor, and the test roster/lineup. Choose **Refresh** if the information is not visible immediately.
7. Choose **Sign out** and confirm that the reports disappear and the sign-in form returns.

The dashboard's **Clear saved data** button deletes all centrally reported roster and lineup snapshots without changing anything saved in visitors' browsers. **Clear visitors** empties the recent visitor-event list, but the all-time visit and unique-visitor counters are preserved. Both actions ask for confirmation and cannot be undone.

There is intentionally no Admin button on the normal site. Bookmark the admin address for your own use. Anyone who guesses the address will still need an allowlisted account and its password.

## Adding another administrator later

1. Create the additional user under **Authentication → Users**.
2. Copy that user's UID.
3. Run the Step 4 query with the new UID.

To remove access without deleting a login, run:

```sql
delete from public.admin_users
where user_id = 'USER-UID-TO-REMOVE';
```

## Troubleshooting

### “Admin reporting needs configuration”

`admin-config.js` still has an empty or misspelled project URL/key. Repeat Steps 5 and 6, then hard-refresh the page.

### “Invalid login credentials”

- Confirm you are using the email and password created under Supabase **Authentication → Users**.
- The Supabase database password is different and will not work here.
- If needed, reset or recreate the Authentication user, then repeat Step 4 with the new UID.

### Login works, but dashboard data will not load

The user probably has not been allowlisted. Repeat Step 4 with the exact UID from **Authentication → Users**. Also confirm that Step 3 completed successfully.

### Dashboard loads but is empty

- Visit the regular builder after configuring and deploying `admin-config.js`; visits made before setup cannot be recovered.
- Make a roster change, wait a few seconds, then choose **Refresh** in the dashboard.
- Confirm the deployed site—not only your GitHub file—contains the connection values.
- In Supabase **Table Editor**, check whether `visitor_events` and `roster_snapshots` contain rows.

### The SQL Editor says a policy or table already exists

Copy the current complete `supabase-admin.sql` and run it again. The script preserves existing report data and recreates its policies.

### The normal lineup builder stops syncing reports

The lineup builder still saves to that visitor's browser even if Supabase is offline or misconfigured. Check the project URL/key and confirm that the Supabase project is active, then reload the builder.

## Privacy reminder

When configured, reporting stores a random browser identifier, IP address, visit time, page path, referrer, browser user-agent string, and a copy of locally saved team/lineup data. A default empty team named “New Team” is not submitted as a roster snapshot, so a visitor who only opens the builder appears in visitor reporting but not under created rosters and lineups. Repeat loads from the same browser within five minutes are ignored; a later load counts as another visit. The unique-visitor total groups visits by the random identifier saved in that browser. The identifier has no application expiration date: it normally remains in that browser's `localStorage` indefinitely, even after the browser or device is restarted, until the browser clears or evicts the site's data. Private browsing generally removes it when the private session closes. Clearing site data, private browsing, another browser or device, or visiting the site at a different origin can therefore create a new identifier and count the same person again. Add an appropriate privacy notice and follow the privacy and data-retention rules that apply where you operate the site.
