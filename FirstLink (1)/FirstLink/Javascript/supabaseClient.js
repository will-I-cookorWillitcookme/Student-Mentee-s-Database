// ══════════════════════════════════════════════════════════════
//  supabaseClient.js — FirstLink (JSU Mentoring)
//  Creates one shared connection to your Supabase database.
//  Must be loaded AFTER the Supabase CDN script and BEFORE
//  Authetication.js / risk_engine.js on every page.
// ══════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://yabulosrxqqlstxstlqp.supabase.co";
const SUPABASE_KEY = "sb_publishable_khbfoIcGddZw8ZQpVPMykQ__W9pWHPB";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);