import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hiydkmsxopgdfqlsepnj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeWRrbXN4b3BnZGZxbHNlcG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjM1MDksImV4cCI6MjA3NDc5OTUwOX0.arRM5Sqt67I-V1sP7ky-rFUUDeJuhvhUMZOdZ1F1_jc';

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