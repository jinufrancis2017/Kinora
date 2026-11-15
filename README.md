# KINORA — mobile-first starter

A free-first, mobile-friendly encyclopedia starter using static HTML/CSS/JS, GitHub Pages and Supabase.

## Preview
Open `index.html` in a browser. The interface works as a visual prototype without Supabase.

## Connect Supabase
1. Create a free Supabase project.
2. Open SQL Editor and run `supabase-schema.sql`.
3. Copy the Project URL and anon/public key from Project Settings → API.
4. Paste them into `config.js`.
5. Enable email authentication in Supabase Auth.
6. Deploy the folder to a GitHub repository and enable GitHub Pages.

## Current status
- Responsive landing page and article cards
- Search within currently loaded cards
- Article suggestion form
- Published-only public article query
- Draft-only insert policy for authenticated users

## Important next stages
- Add sign-up/sign-in and user attribution.
- Add moderator roles and secure moderation policies.
- Add revision history, diffs, rollback and audit log.
- Add automated spam/profanity/link checks.
- Add editor reputation and trusted-editor permissions.
- Add article detail pages, categories, citations and SEO.

This is a starter, not yet a production-ready encyclopedia. Moderator permissions must be implemented securely before public launch.
