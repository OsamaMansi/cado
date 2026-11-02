import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://phjlxjmdtdrolgupnoeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoamx4am1kdGRyb2xndXBub2VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTQxMDYsImV4cCI6MjEwOTE5MDEwNn0.LmMcgFKi7S0a779SqWxNx9duQf2I-jX_tAhDAI7ScOQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);