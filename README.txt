KINORA — Separate pages and contributor profiles

UPLOAD THESE FILES to the ROOT of your existing GitHub repository:
- index.html (replace)
- login.html (new)
- signup.html (new)
- profile.html (new)
- styles.css (replace)
- app.js (replace)

IMPORTANT:
- Do NOT replace or delete your existing config.js. It contains your Supabase project URL and public publishable/anon key.
- Do NOT put a Supabase service_role/secret key in config.js or browser code.
- Keep the existing Supabase JS CDN script references as supplied.

DATABASE STEP:
1. Open your existing Supabase project.
2. Go to SQL Editor → New query.
3. Open profile-schema.sql from this ZIP, copy all its contents, paste into SQL Editor and Run.
4. This creates public profiles and article revision tracking. It does not delete your existing articles.
5. The first time a new account signs up, the username is saved to the profiles table automatically.

PAGES:
- https://jinufrancis2017.github.io/Kinora/
- https://jinufrancis2017.github.io/Kinora/login.html
- https://jinufrancis2017.github.io/Kinora/signup.html
- https://jinufrancis2017.github.io/Kinora/profile.html

CONTRIBUTION COUNTS:
- Articles created: count of articles created by that user.
- Articles edited: unique articles with recorded content revisions by that user.
- Characters added: initial article content plus positive net character additions recorded on edits.
- Revisions are tracked automatically by a database trigger when article content is inserted/updated.
- This update does not yet add an article editing interface or change your review workflow. It prepares reliable tracking for the edit system we can build next.

After uploading, run the SQL migration, then refresh the website. Create a test account and confirm its email before logging in.
