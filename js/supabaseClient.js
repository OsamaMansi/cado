// ==========================================
// أورا للهدايا الفاخرة - ملف الاتصال بقاعدة البيانات (Supabase)
// ==========================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ملاحظة: استبدل القيم أدناه ببيانات مشروعك الحقيقية من لوحة تحكم Supabase (Project Settings -> API)
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);