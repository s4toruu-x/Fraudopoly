import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null without Supabase settings, which turns accounts off. PKCE: a Discord sign-in comes back
 * as ?code=, which leaves the page's # free for its routes.
 */
export const supabase = url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
