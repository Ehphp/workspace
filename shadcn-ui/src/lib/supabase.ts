import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names with app prefix
export const TABLES = {
  CLIENTI: 'app_27ebc3f41a_clienti',
  LOTTI: 'app_27ebc3f41a_lotti',
  SPAZI: 'app_27ebc3f41a_spazi',
  STAZIONI: 'app_27ebc3f41a_stazioni',
  OPPORTUNITA: 'app_27ebc3f41a_opportunita',
  CONTRATTI: 'app_27ebc3f41a_contratti',
  COSTI: 'app_27ebc3f41a_costi',
  MOVIMENTI_CASSA: 'app_27ebc3f41a_movimenti_cassa',
  KPI_SNAPSHOTS: 'app_27ebc3f41a_kpi_snapshots'
} as const;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`${operation} failed: ${error.message}`);
};

// Type mapping for database responses
export interface DatabaseRow {
  id: string;
  created_at: string;
  [key: string]: any;
}
