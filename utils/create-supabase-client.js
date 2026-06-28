import { createClient } from "@supabase/supabase-js";
// import dotenv from 'dotenv';

// dotenv.config();

export default async function createSupabaseClient() {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    return client;
}