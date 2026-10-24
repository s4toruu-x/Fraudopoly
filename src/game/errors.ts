const CONFIRM_EMAIL_IS_ON =
  'This Supabase project still has "Confirm email" turned on, which usernames cannot use. Turn it off under Authentication > Sign In / Providers > Email, then try again.';

/** Maps Supabase errors to messages; the game's own refusals pass through. */
export function explain(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Wrong username or password.";
  if (/already registered|already exists/i.test(message)) return "That username is taken.";
  if (/email not confirmed/i.test(message)) return CONFIRM_EMAIL_IS_ON;
  // Supabase only checks the hidden address when it tries to email it, which
  // happens when confirmation is on
  if (/email address .* is invalid/i.test(message)) return CONFIRM_EMAIL_IS_ON;
  if (/anonymous sign-ins are disabled/i.test(message)) {
    return 'Guests can\'t play yet: this Supabase project has "Allow anonymous sign-ins" off. Turn it on under Authentication > Sign In / Providers. Players with an account can still sign in.';
  }
  if (/could not find the function|schema cache/i.test(message)) {
    return "The game's database isn't set up yet. Run supabase/migrations and supabase/seed.sql in the Supabase SQL Editor (see the README).";
  }
  if (/failed to fetch|network/i.test(message)) return "Could not reach the server. Check your connection.";
  return message;
}
