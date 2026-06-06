# Supabase Auth Security Checklist

Enable these settings in the Supabase Dashboard before production:

- Auth > Providers > Email: enable **Email provider**.
- Auth > Providers > Email: enable **Secure email change**.
- Auth > Providers > Email: enable **Secure password change**.
- Auth > Providers > Email: enable **Require current password when updating**.
- Auth > Password Security: enable **Prevent use of leaked passwords**.
- Auth > Password Security: set minimum password length to at least `8`.
- Auth > Password Security: require uppercase, lowercase, numbers, and symbols.

Notes:

- These are project-level Auth settings, not table schema settings, so `supabase_setup.sql` cannot fully enable them.
- The app mirrors the password-strength requirements during account creation, but Supabase must still enforce them server-side.
- Leaked-password protection is handled by Supabase Auth using HaveIBeenPwned and may require a Pro plan.

References:

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/password-security
