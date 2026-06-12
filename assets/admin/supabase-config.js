/* ============================================================
   ListEdge Admin — Supabase connection
   ------------------------------------------------------------
   This is the ONLY file you need to edit to connect the admin
   area to your Supabase project. Replace the two values below.

   Both of these values are SAFE to be public — they are meant
   to live in the browser. (Your real security comes from your
   single admin login and Supabase's access rules, not from
   hiding these.) See the setup guide for full details.
   ============================================================ */

window.LISTEDGE_SUPABASE = {

  // 1) Supabase dashboard  →  Settings  →  API  →  "Project URL"
  //    Looks like:  https://abcdefghijklmnop.supabase.co
  url: "https://YOUR-PROJECT-REF.supabase.co",

  // 2) Supabase dashboard  →  Settings  →  API Keys  →  "Publishable key"
  //    Looks like:  sb_publishable_xxxxxxxxxxxxxxxxxxxxx
  //    (Older projects show an "anon public" key starting with eyJ... — that works too.)
  anonKey: "YOUR-PUBLISHABLE-OR-ANON-KEY"

};
