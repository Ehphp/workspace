// Core entity types for Brellò Sales & Finance Cockpit

export type UserRole = 'admin' | 'sales' | 'finance' | 'viewer';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  attivo: boolean;
}

export type ClienteCategoria = 'PMI_LOCALE' | 'PMI_REGIONALE' | 'PMI_NAZIONALE' | 'ISTITUZIONALE';

export interface Cliente {
  id: string;
  ragione_sociale: string;
  piva_codfisc: string;
  categoria: ClienteCategoria;
  contatti: {
    email: string;
    telefono: string;
    indirizzo: string;
    referente: string;
  };
  note?: string;
  attivo: boolean;
  created_at: string;
}

export type LottoStato = 'PREVENDITA' | 'ATTIVO' | 'CHIUSO';

export interface Lotto {
  id: string;
  codice_lotto: string;
  citta: string;
  periodo_start: string;
  periodo_end: string;
  inventario_spazi: number;
  stazioni_tot: number;
  stato: LottoStato;
  soglia_go_nogo: number;
  target_ricavo: number;
  created_at: string;
}

export type SpazioTipo = 'STANDARD' | 'PLUS' | 'PREMIUM';
export type SpazioStato = 'LIBERO' | 'OPZIONATO' | 'VENDUTO' | 'INVENDUTO';

export interface Spazio {
  id: string;
  lotto_id: string;
  numero_spazio: number;
  tipo: SpazioTipo;
  prezzo_listino: number;
  sconto_perc: number;
  prezzo_netto: number;
  stato: SpazioStato;
  cliente_id?: string;
  contratto_id?: string;
}

export type StazioneStato = 'LIBERA' | 'OPZIONATA' | 'VENDUTA';

export interface SponsorshipStazione {
  id: string;
  lotto_id: string;
  numero_stazione: number;
  prezzo_listino_lotto: number;
  sconto_perc: number;
  prezzo_netto: number;
  stato: StazioneStato;
  cliente_id?: string;
  contratto_id?: string;
}

export type OpportunitaFase = 'LEAD' | 'QUALIFICA' | 'OFFERTA' | 'CHIUSURA';
export type OpportunitaTipo = 'SPAZIO' | 'STAZIONE' | 'MISTO';

export interface Opportunita {
  id: string;
  cliente_id: string;
  lotto_id: string;
  oggetto: string;
  tipo: OpportunitaTipo;
  valore_previsto: number;
  fase: OpportunitaFase;
  probabilita_perc: number;
  data_chiusura_prevista?: string;
  note?: string;
  assegnato_a?: string;
  created_at: string;
}

export type ContrattoStato = 'BOZZA' | 'INVIATO' | 'FIRMATO' | 'INCASSATO' | 'ANNULLATO';

export interface Contratto {
  id: string;
  numero_contratto: string;
  cliente_id: string;
  lotto_id: string;
  ricavo_totale: number;
  termini_pagamento?: string;
  date_incasso_previste: string[];
  stato: ContrattoStato;
  created_at: string;
}

export type CostCategoria = 'PERSONALE' | 'VEICOLO' | 'OMBRELLI' | 'STAZIONI' | 'MARKETING' | 'PERMESSI' | 'PERDITE' | 'ALTRO';
export type CostCadenza = 'UNA_TANTUM' | 'MENSILE' | 'LOTTO' | 'ANNUALE';

export interface CostItem {
  id: string;
  lotto_id?: string;
  categoria: CostCategoria;
  descrizione: string;
  importo: number;
  cadenza: CostCadenza;
  data_competenza: string;
  ricorrente: boolean;
  created_at: string;
}

export type MovimentoTipo = 'INCASSO' | 'PAGAMENTO';
export type MovimentoStato = 'PREVISTO' | 'INCASSATO' | 'PAGATO';

export interface MovimentoCassa {
  id: string;
  data: string;
  tipo: MovimentoTipo;
  importo: number;
  cliente_fornitore?: string;
  descrizione: string;
  riferimento_contratto_id?: string;
  riferimento_costo_id?: string;
  stato: MovimentoStato;
  created_at: string;
}

export interface KPISnapshot {
  id: string;
  lotto_id: string;
  data_snapshot: string;
  occupancy_spazi_perc: number;
  occupancy_stazioni_perc: number;
  ricavo_lotto: number;
  costo_lotto: number;
  margine_lotto: number;
  margine_perc: number;
  lead_to_close_perc?: number;
  cac_per_segmento?: Record<string, number>;
}

// Dashboard specific types
export interface DashboardData {
  lotto_corrente: Lotto;
  occupancy_spazi: number;
  occupancy_stazioni: number;
  ricavo_attuale: number;
  target_ricavo: number;
  margine_ytd: number;
  break_even_status: {
    ricavi_annui: number;
    soglia_break_even: number;
    percentuale_raggiunta: number;
  };
  go_nogo_status: {
    status: 'GO' | 'WARNING' | 'NO_GO';
    occupancy_attuale: number;
    soglia_richiesta: number;
    giorni_rimanenti: number;
    blocco_stampa: boolean;
  };
  funnel_vendite: {
    lead: number;
    qualifica: number;
    offerta: number;
    chiusura: number;
  };
}

// Preventivatore types
export interface PreventivatoreRequest {
  cliente_id: string;
  lotto_id: string;
  spazi: Array<{
    tipo: SpazioTipo;
    quantita: number;
    sconto_perc?: number;
  }>;
  stazioni: Array<{
    numero_stazione: number;
    sconto_perc?: number;
  }>;
}

export interface PreventivatoreResult {
  ricavo_totale: number;
  costo_allocato: number;
  margine_lordo: number;
  margine_perc: number;
  dettaglio_spazi: Array<{
    tipo: SpazioTipo;
    quantita: number;
    prezzo_unitario: number;
    sconto_perc: number;
    totale: number;
  }>;
  dettaglio_stazioni: Array<{
    numero_stazione: number;
    prezzo_unitario: number;
    sconto_perc: number;
    totale: number;
  }>;
}

// Scenario Planner types
export interface ScenarioParams {
  occupancy_spazi_perc: number;
  occupancy_stazioni_perc: number;
  prezzo_medio_variazione: number; // -20% to +20%
  costi_variazione: number; // -10% to +15%
}

export interface ScenarioResult {
  nome: string;
  ricavi_annui: number;
  costi_annui: number;
  margine_annuo: number;
  margine_perc: number;
  break_even_raggiunto: boolean;
  variazione_vs_base: {
    ricavi: number;
    margine: number;
  };
}

// Report types
export interface ReportFilters {
  data_da?: string;
  data_a?: string;
  lotto_id?: string;
  cliente_categoria?: ClienteCategoria;
  segmento?: string;
}

export interface VenditePerSegmentoReport {
  segmento: ClienteCategoria;
  numero_clienti: number;
  ricavo_totale: number;
  margine_medio: number;
  tasso_conversione: number;
}

// Utility types
export interface SelectOption {
  value: string;
  label: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  periodo: string;
  valore: number;
  target?: number;
}