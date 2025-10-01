import { create } from 'zustand';
import { supabase, TABLES, handleSupabaseError } from '@/lib/supabase';
import type {
  Cliente,
  Lotto,
  Spazio,
  SponsorshipStazione,
  Opportunita,
  Contratto,
  CostItem,
  MovimentoCassa,
  KPISnapshot,
  DashboardData,
  PreventivatoreResult,
  ScenarioResult,
  ScenarioParams
} from '@/types';

type LottoInput = {
  codice_lotto: string;
  citta: string;
  indirizzo: string;
  stato: Lotto['stato'];
  data_inizio: string;
  data_fine: string;
  note?: string;
};

const normalizeLottoText = (value: string) => value.trim();

const buildLottoUpdatePayload = (lotto: LottoInput) => ({
  codice_lotto: normalizeLottoText(lotto.codice_lotto),
  citta: normalizeLottoText(lotto.citta),
  indirizzo: normalizeLottoText(lotto.indirizzo),
  stato: lotto.stato,
  data_inizio: lotto.data_inizio,
  data_fine: lotto.data_fine,
  periodo_start: lotto.data_inizio,
  periodo_end: lotto.data_fine,
  note: lotto.note && lotto.note.trim().length > 0 ? lotto.note.trim() : null,
});

const buildLottoInsertPayload = (lotto: LottoInput) => ({
  ...buildLottoUpdatePayload(lotto),
  inventario_spazi: 18,
  stazioni_tot: 10,
  soglia_go_nogo: 70,
  target_ricavo: 0,
});

interface BrelloState {
  // Core Data
  clienti: Cliente[];
  lotti: Lotto[];
  spazi: Spazio[];
  stazioni: SponsorshipStazione[];
  opportunita: Opportunita[];
  contratti: Contratto[];
  costi: CostItem[];
  movimenti_cassa: MovimentoCassa[];
  kpi_snapshots: KPISnapshot[];
  
  // UI State
  currentLotto: Lotto | null;
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentLotto: (lotto: Lotto) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data Loading
  loadAllData: () => Promise<void>;
  loadClienti: () => Promise<void>;
  loadLotti: () => Promise<void>;
  loadSpazi: () => Promise<void>;
  loadStazioni: () => Promise<void>;
  loadOpportunita: () => Promise<void>;
  loadContratti: () => Promise<void>;
  loadCosti: () => Promise<void>;
  loadMovimentiCassa: () => Promise<void>;
  loadKPISnapshots: () => Promise<void>;
  
  // CRUD Operations
  addCliente: (cliente: Omit<Cliente, 'id' | 'created_at'>) => Promise<void>;
  updateCliente: (id: string, updates: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
  
  addOpportunita: (opportunita: Omit<Opportunita, 'id' | 'created_at'>) => Promise<void>;
  updateOpportunita: (id: string, updates: Partial<Opportunita>) => Promise<void>;
  updateOpportunitaFase: (id: string, fase: Opportunita['fase']) => Promise<void>;
  deleteOpportunita: (id: string) => Promise<void>;
  addLotto: (lotto: LottoInput) => Promise<void>;
  updateLotto: (id: string, lotto: LottoInput) => Promise<void>;
  deleteLotto: (id: string) => Promise<void>;
  
  addCostItem: (cost: Omit<CostItem, 'id' | 'created_at'>) => Promise<void>;
  updateCostItem: (id: string, updates: Partial<CostItem>) => Promise<void>;
  deleteCostItem: (id: string) => Promise<void>;
  
  addMovimentoCassa: (movimento: Omit<MovimentoCassa, 'id' | 'created_at'>) => Promise<void>;
  updateMovimentoCassa: (id: string, updates: Partial<MovimentoCassa>) => Promise<void>;
  
  // Business Logic
  calculateDashboardData: () => DashboardData | null;
  calculatePreventivatoreResult: (request: any) => PreventivatoreResult;
  calculateScenario: (params: ScenarioParams, nome: string) => ScenarioResult;
  
  // Data Initialization
  initializeData: () => Promise<void>;
}

export const useBrelloStore = create<BrelloState>((set, get) => ({
  // Initial state
  clienti: [],
  lotti: [],
  spazi: [],
  stazioni: [],
  opportunita: [],
  contratti: [],
  costi: [],
  movimenti_cassa: [],
  kpi_snapshots: [],
  currentLotto: null,
  dashboardData: null,
  loading: false,
  error: null,
  
  // UI Actions
  setCurrentLotto: (lotto: Lotto) => {
    set({ currentLotto: lotto });
  },
  
  setLoading: (loading: boolean) => {
    set({ loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // Data Loading Functions
  loadAllData: async () => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        get().loadClienti(),
        get().loadLotti(),
        get().loadSpazi(),
        get().loadStazioni(),
        get().loadOpportunita(),
        get().loadContratti(),
        get().loadCosti(),
        get().loadMovimentiCassa(),
        get().loadKPISnapshots()
      ]);
      
      // Set current lotto to the first one found
      const { lotti } = get();
      if (lotti.length > 0) {
        set({ currentLotto: lotti[0] });
      }
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },
  
  loadClienti: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTI)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load clienti');
      set({ clienti: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load clienti');
    }
  },
  
  loadLotti: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.LOTTI)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load lotti');
      set({ lotti: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load lotti');
    }
  },
  
  addLotto: async (lottoInput) => {
    try {
      const payload = buildLottoInsertPayload(lottoInput);
      const { data, error } = await supabase
        .from(TABLES.LOTTI)
        .insert([payload])
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Add lotto failed: nessun dato restituito');

      set((state) => ({
        lotti: [data, ...state.lotti],
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Add lotto');
    }
  },

  updateLotto: async (id, lottoInput) => {
    try {
      const payload = buildLottoUpdatePayload(lottoInput);
      const { data, error } = await supabase
        .from(TABLES.LOTTI)
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Update lotto failed: nessun dato restituito');

      set((state) => ({
        lotti: state.lotti.map((lotto) => (lotto.id === id ? data : lotto)),
        currentLotto: state.currentLotto?.id === id ? data : state.currentLotto,
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Update lotto');
    }
  },

  deleteLotto: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.LOTTI)
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const updatedLotti = state.lotti.filter((lotto) => lotto.id !== id);
        const nextCurrent = state.currentLotto?.id === id ? updatedLotti[0] || null : state.currentLotto;
        return {
          lotti: updatedLotti,
          currentLotto: nextCurrent,
        };
      });
    } catch (error: any) {
      handleSupabaseError(error, 'Delete lotto');
    }
  },

  loadSpazi: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPAZI)
        .select('*')
        .order('numero_spazio');
      
      if (error) handleSupabaseError(error, 'Load spazi');
      set({ spazi: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load spazi');
    }
  },
  
  loadStazioni: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.STAZIONI)
        .select('*')
        .order('numero_stazione');
      
      if (error) handleSupabaseError(error, 'Load stazioni');
      set({ stazioni: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load stazioni');
    }
  },
  
  loadOpportunita: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.OPPORTUNITA)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load opportunita');
      set({ opportunita: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load opportunita');
    }
  },
  
  loadContratti: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CONTRATTI)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load contratti');
      set({ contratti: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load contratti');
    }
  },
  
  loadCosti: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COSTI)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load costi');
      set({ costi: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load costi');
    }
  },
  
  loadMovimentiCassa: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MOVIMENTI_CASSA)
        .select('*')
        .order('data', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load movimenti cassa');
      set({ movimenti_cassa: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load movimenti cassa');
    }
  },
  
  loadKPISnapshots: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.KPI_SNAPSHOTS)
        .select('*')
        .order('data_snapshot', { ascending: false });
      
      if (error) handleSupabaseError(error, 'Load KPI snapshots');
      set({ kpi_snapshots: data || [] });
    } catch (error: any) {
      handleSupabaseError(error, 'Load KPI snapshots');
    }
  },
  
  // CRUD Operations
  addCliente: async (clienteData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTI)
        .insert([clienteData])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Add cliente');
      
      set(state => ({ clienti: [data, ...state.clienti] }));
    } catch (error: any) {
      handleSupabaseError(error, 'Add cliente');
    }
  },
  
  updateCliente: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLIENTI)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Update cliente');
      
      set(state => ({
        clienti: state.clienti.map(c => c.id === id ? data : c)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Update cliente');
    }
  },
  
  deleteCliente: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.CLIENTI)
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error, 'Delete cliente');
      
      set(state => ({
        clienti: state.clienti.filter(c => c.id !== id)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Delete cliente');
    }
  },
  
  addOpportunita: async (oppData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.OPPORTUNITA)
        .insert([oppData])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Add opportunita');
      
      set(state => ({ opportunita: [data, ...state.opportunita] }));
    } catch (error: any) {
      handleSupabaseError(error, 'Add opportunita');
    }
  },
  
  updateOpportunita: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.OPPORTUNITA)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Update opportunita');
      
      set(state => ({
        opportunita: state.opportunita.map(o => o.id === id ? data : o)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Update opportunita');
    }
  },
  
  updateOpportunitaFase: async (id, fase) => {
    await get().updateOpportunita(id, { fase });
  },
  
  deleteOpportunita: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.OPPORTUNITA)
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error, 'Delete opportunita');
      
      set(state => ({
        opportunita: state.opportunita.filter(o => o.id !== id)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Delete opportunita');
    }
  },
  
  addCostItem: async (costData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COSTI)
        .insert([costData])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Add cost item');
      
      set(state => ({ costi: [data, ...state.costi] }));
    } catch (error: any) {
      handleSupabaseError(error, 'Add cost item');
    }
  },
  
  updateCostItem: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COSTI)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Update cost item');
      
      set(state => ({
        costi: state.costi.map(c => c.id === id ? data : c)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Update cost item');
    }
  },
  
  deleteCostItem: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.COSTI)
        .delete()
        .eq('id', id);
      
      if (error) handleSupabaseError(error, 'Delete cost item');
      
      set(state => ({
        costi: state.costi.filter(c => c.id !== id)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Delete cost item');
    }
  },
  
  addMovimentoCassa: async (movimentoData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MOVIMENTI_CASSA)
        .insert([movimentoData])
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Add movimento cassa');
      
      set(state => ({ movimenti_cassa: [data, ...state.movimenti_cassa] }));
    } catch (error: any) {
      handleSupabaseError(error, 'Add movimento cassa');
    }
  },
  
  updateMovimentoCassa: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.MOVIMENTI_CASSA)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleSupabaseError(error, 'Update movimento cassa');
      
      set(state => ({
        movimenti_cassa: state.movimenti_cassa.map(m => m.id === id ? data : m)
      }));
    } catch (error: any) {
      handleSupabaseError(error, 'Update movimento cassa');
    }
  },
  
  // Business logic calculations (unchanged from localStorage version)
  calculateDashboardData: () => {
    const state = get();
    const currentLotto = state.lotti.find(l => l.codice_lotto === '2025-Q4-AL');
    if (!currentLotto) return null;
    
    const lottoSpazi = state.spazi.filter(s => s.lotto_id === currentLotto.id);
    const lottoStazioni = state.stazioni.filter(s => s.lotto_id === currentLotto.id);
    
    // Calculate occupancy
    const spaziVenduti = lottoSpazi.filter(s => s.stato === 'VENDUTO').length;
    const stazioniVendute = lottoStazioni.filter(s => s.stato === 'VENDUTA').length;
    
    const occupancy_spazi = (spaziVenduti / currentLotto.inventario_spazi) * 100;
    const occupancy_stazioni = (stazioniVendute / currentLotto.stazioni_tot) * 100;
    
    // Calculate revenue
    const ricavo_spazi = lottoSpazi
      .filter(s => s.stato === 'VENDUTO')
      .reduce((sum, s) => sum + s.prezzo_netto, 0);
    const ricavo_stazioni = lottoStazioni
      .filter(s => s.stato === 'VENDUTA')
      .reduce((sum, s) => sum + s.prezzo_netto, 0);
    const ricavo_attuale = ricavo_spazi + ricavo_stazioni;
    
    // Calculate annual projections (3 lotti/anno)
    const ricavi_annui_proiettati = ricavo_attuale * 3;
    const costi_annui = state.costi.reduce((sum, c) => sum + c.importo, 0);
    const margine_ytd = ricavi_annui_proiettati - costi_annui;
    
    // Go/No-Go status
    const giorni_rimanenti = Math.ceil(
      (new Date(currentLotto.periodo_start).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let go_nogo_status: 'GO' | 'WARNING' | 'NO_GO' = 'GO';
    let blocco_stampa = false;
    
    if (occupancy_spazi < currentLotto.soglia_go_nogo) {
      if (giorni_rimanenti <= 14) {
        go_nogo_status = 'NO_GO';
        blocco_stampa = true;
      } else if (giorni_rimanenti <= 30) {
        go_nogo_status = 'WARNING';
      }
    }
    
    // Funnel vendite
    const funnel_vendite = {
      lead: state.opportunita.filter(o => o.fase === 'LEAD').length,
      qualifica: state.opportunita.filter(o => o.fase === 'QUALIFICA').length,
      offerta: state.opportunita.filter(o => o.fase === 'OFFERTA').length,
      chiusura: state.opportunita.filter(o => o.fase === 'CHIUSURA').length
    };
    
    const dashboardData: DashboardData = {
      lotto_corrente: currentLotto,
      occupancy_spazi,
      occupancy_stazioni,
      ricavo_attuale,
      target_ricavo: currentLotto.target_ricavo,
      margine_ytd,
      break_even_status: {
        ricavi_annui: ricavi_annui_proiettati,
        soglia_break_even: 46200,
        percentuale_raggiunta: (ricavi_annui_proiettati / 46200) * 100
      },
      go_nogo_status: {
        status: go_nogo_status,
        occupancy_attuale: occupancy_spazi,
        soglia_richiesta: currentLotto.soglia_go_nogo,
        giorni_rimanenti,
        blocco_stampa
      },
      funnel_vendite
    };
    
    set({ dashboardData });
    return dashboardData;
  },
  
  calculatePreventivatoreResult: (request) => {
    const state = get();
    const costoLottoAllocato = state.costi.reduce((sum, c) => sum + c.importo, 0) / 3;
    
    let ricavo_totale = 0;
    const dettaglio_spazi = request.spazi.map((spazio: any) => {
      const prezzo_base = spazio.tipo === 'STANDARD' ? 900 : spazio.tipo === 'PLUS' ? 1100 : 1500;
      const sconto = spazio.sconto_perc || 0;
      const prezzo_unitario = prezzo_base * (1 - sconto / 100);
      const totale = prezzo_unitario * spazio.quantita;
      ricavo_totale += totale;
      
      return {
        tipo: spazio.tipo,
        quantita: spazio.quantita,
        prezzo_unitario: prezzo_base,
        sconto_perc: sconto,
        totale
      };
    });
    
    const dettaglio_stazioni = request.stazioni.map((stazione: any) => {
      const prezzo_base = 900;
      const sconto = stazione.sconto_perc || 0;
      const prezzo_unitario = prezzo_base * (1 - sconto / 100);
      ricavo_totale += prezzo_unitario;
      
      return {
        numero_stazione: stazione.numero_stazione,
        prezzo_unitario: prezzo_base,
        sconto_perc: sconto,
        totale: prezzo_unitario
      };
    });
    
    const margine_lordo = ricavo_totale - costoLottoAllocato;
    const margine_perc = ricavo_totale > 0 ? (margine_lordo / ricavo_totale) * 100 : 0;
    
    return {
      ricavo_totale,
      costo_allocato: costoLottoAllocato,
      margine_lordo,
      margine_perc,
      dettaglio_spazi,
      dettaglio_stazioni
    };
  },
  
  calculateScenario: (params: ScenarioParams, nome: string) => {
    const state = get();
    const costiAnnuiBase = state.costi.reduce((sum, c) => sum + c.importo, 0);
    
    const ricavoBaseLotto = 19300;
    const prezzoMedioBase = ricavoBaseLotto / 16;
    
    const nuovoPrezzoMedio = prezzoMedioBase * (1 + params.prezzo_medio_variazione / 100);
    const nuoviCostiAnnui = costiAnnuiBase * (1 + params.costi_variazione / 100);
    
    const spaziVenduti = Math.round((params.occupancy_spazi_perc / 100) * 18);
    const stazioniVendute = Math.round((params.occupancy_stazioni_perc / 100) * 10);
    
    const ricavoSpaziLotto = spaziVenduti * nuovoPrezzoMedio;
    const ricavoStazioniLotto = stazioniVendute * 900;
    const ricavoLotto = ricavoSpaziLotto + ricavoStazioniLotto;
    const ricaviAnnui = ricavoLotto * 3;
    
    const margineAnnuo = ricaviAnnui - nuoviCostiAnnui;
    const marginePerc = ricaviAnnui > 0 ? (margineAnnuo / ricaviAnnui) * 100 : 0;
    
    const dashboardData = get().calculateDashboardData();
    const ricaviAnnuiBase = dashboardData?.break_even_status.ricavi_annui || 57900;
    const margineAnnuoBase = ricaviAnnuiBase - costiAnnuiBase;
    
    return {
      nome,
      ricavi_annui: ricaviAnnui,
      costi_annui: nuoviCostiAnnui,
      margine_annuo: margineAnnuo,
      margine_perc: marginePerc,
      break_even_raggiunto: ricaviAnnui >= 46200,
      variazione_vs_base: {
        ricavi: ricaviAnnui - ricaviAnnuiBase,
        margine: margineAnnuo - margineAnnuoBase
      }
    };
  },
  
  // Initialize with sample data
  initializeData: async () => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      // Check if data already exists
      const { data: existingLotti } = await supabase
        .from(TABLES.LOTTI)
        .select('id')
        .limit(1);
      
      if (existingLotti && existingLotti.length > 0) {
        // Data exists, just load it
        await get().loadAllData();
        return;
      }
      
      // Insert sample data
      await get().insertSampleData();
      await get().loadAllData();
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },
  
  // Helper function to insert sample data
  insertSampleData: async () => {
    const now = new Date().toISOString();
    
    // Insert sample clients
    const { data: clientiData, error: clientiError } = await supabase
      .from(TABLES.CLIENTI)
      .insert([
        {
          ragione_sociale: 'Bar Centrale Alatri',
          piva_codfisc: '12345678901',
          categoria: 'PMI_LOCALE',
          contatti: {
            email: 'info@barcentrale.it',
            telefono: '0775123456',
            indirizzo: 'Piazza Regina Margherita 1, Alatri',
            referente: 'Mario Rossi'
          },
          attivo: true
        },
        {
          ragione_sociale: 'Farmacia San Francesco',
          piva_codfisc: '98765432109',
          categoria: 'PMI_LOCALE',
          contatti: {
            email: 'farmacia@sanfrancesco.it',
            telefono: '0775654321',
            indirizzo: 'Via Roma 45, Alatri',
            referente: 'Dott.ssa Bianchi'
          },
          attivo: true
        },
        {
          ragione_sociale: 'Banca Popolare del Lazio',
          piva_codfisc: '11223344556',
          categoria: 'PMI_REGIONALE',
          contatti: {
            email: 'marketing@bpl.it',
            telefono: '0775111222',
            indirizzo: 'Corso della Repubblica 12, Alatri',
            referente: 'Ing. Verdi'
          },
          attivo: true
        },
        {
          ragione_sociale: 'Comune di Alatri',
          piva_codfisc: '80001234567',
          categoria: 'ISTITUZIONALE',
          contatti: {
            email: 'comunicazione@comune.alatri.fr.it',
            telefono: '0775434343',
            indirizzo: 'Piazza Santa Maria Maggiore 1, Alatri',
            referente: 'Assessore Cultura'
          },
          attivo: true
        }
      ])
      .select();
    
    if (clientiError) handleSupabaseError(clientiError, 'Insert sample clienti');
    
    // Insert sample lotto
    const { data: lottiData, error: lottiError } = await supabase
      .from(TABLES.LOTTI)
      .insert([{
        codice_lotto: '2025-Q4-AL',
        citta: 'Alatri',
        periodo_start: '2025-10-01',
        periodo_end: '2025-12-31',
        inventario_spazi: 18,
        stazioni_tot: 10,
        stato: 'PREVENDITA',
        soglia_go_nogo: 70,
        target_ricavo: 19300
      }])
      .select()
      .single();
    
    if (lottiError) handleSupabaseError(lottiError, 'Insert sample lotti');
    
    const lottoId = lottiData.id;
    const clientiIds = clientiData?.map(c => c.id) || [];
    
    // Insert sample spazi (16 venduti, 2 liberi)
    const spaziData = [];
    let spazioCounter = 1;
    
    // 6 Standard venduti
    for (let i = 0; i < 6; i++) {
      spaziData.push({
        lotto_id: lottoId,
        numero_spazio: spazioCounter++,
        tipo: 'STANDARD',
        prezzo_listino: 900,
        sconto_perc: 0,
        prezzo_netto: 900,
        stato: 'VENDUTO',
        cliente_id: clientiIds[i < 2 ? 0 : i < 4 ? 1 : 3],
        contratto_id: `contratto-${i + 1}`
      });
    }
    
    // 8 Plus venduti
    for (let i = 0; i < 8; i++) {
      spaziData.push({
        lotto_id: lottoId,
        numero_spazio: spazioCounter++,
        tipo: 'PLUS',
        prezzo_listino: 1100,
        sconto_perc: i < 2 ? 5 : 0,
        prezzo_netto: i < 2 ? 1045 : 1100,
        stato: 'VENDUTO',
        cliente_id: clientiIds[i < 3 ? 1 : i < 6 ? 2 : 0],
        contratto_id: `contratto-${i + 7}`
      });
    }
    
    // 2 Premium venduti
    for (let i = 0; i < 2; i++) {
      spaziData.push({
        lotto_id: lottoId,
        numero_spazio: spazioCounter++,
        tipo: 'PREMIUM',
        prezzo_listino: 1500,
        sconto_perc: 0,
        prezzo_netto: 1500,
        stato: 'VENDUTO',
        cliente_id: clientiIds[2],
        contratto_id: `contratto-${i + 15}`
      });
    }
    
    // 2 invenduti
    for (let i = 0; i < 2; i++) {
      spaziData.push({
        lotto_id: lottoId,
        numero_spazio: spazioCounter++,
        tipo: 'STANDARD',
        prezzo_listino: 900,
        sconto_perc: 0,
        prezzo_netto: 900,
        stato: 'LIBERO'
      });
    }
    
    const { error: spaziError } = await supabase
      .from(TABLES.SPAZI)
      .insert(spaziData);
    
    if (spaziError) handleSupabaseError(spaziError, 'Insert sample spazi');
    
    // Insert sample stazioni (7 vendute, 3 libere)
    const stazioniData = [];
    for (let i = 1; i <= 10; i++) {
      stazioniData.push({
        lotto_id: lottoId,
        numero_stazione: i,
        prezzo_listino_lotto: 900,
        sconto_perc: 0,
        prezzo_netto: 900,
        stato: i <= 7 ? 'VENDUTA' : 'LIBERA',
        cliente_id: i <= 7 ? clientiIds[i <= 3 ? 0 : i <= 5 ? 1 : 2] : null,
        contratto_id: i <= 7 ? `contratto-stazione-${i}` : null
      });
    }
    
    const { error: stazioniError } = await supabase
      .from(TABLES.STAZIONI)
      .insert(stazioniData);
    
    if (stazioniError) handleSupabaseError(stazioniError, 'Insert sample stazioni');
    
    // Insert sample opportunità
    const { error: opportunitaError } = await supabase
      .from(TABLES.OPPORTUNITA)
      .insert([
        {
          cliente_id: clientiIds[0],
          lotto_id: lottoId,
          oggetto: 'Spazio Plus Autunno 2025',
          tipo: 'SPAZIO',
          valore_previsto: 1100,
          fase: 'LEAD',
          probabilita_perc: 30,
          data_chiusura_prevista: '2025-09-15',
          note: 'Interessato a visibilità durante eventi autunnali'
        },
        {
          cliente_id: clientiIds[1],
          lotto_id: lottoId,
          oggetto: 'Sponsorship Stazione Centro',
          tipo: 'STAZIONE',
          valore_previsto: 900,
          fase: 'QUALIFICA',
          probabilita_perc: 60,
          data_chiusura_prevista: '2025-09-20'
        },
        {
          cliente_id: clientiIds[2],
          lotto_id: lottoId,
          oggetto: 'Pacchetto Premium + Stazione',
          tipo: 'MISTO',
          valore_previsto: 2400,
          fase: 'OFFERTA',
          probabilita_perc: 80,
          data_chiusura_prevista: '2025-09-25'
        }
      ]);
    
    if (opportunitaError) handleSupabaseError(opportunitaError, 'Insert sample opportunita');
    
    // Insert sample costi (€46,200 totali)
    const { error: costiError } = await supabase
      .from(TABLES.COSTI)
      .insert([
        {
          categoria: 'PERSONALE',
          descrizione: 'Stipendio operatore + contributi',
          importo: 25800,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        },
        {
          categoria: 'VEICOLO',
          descrizione: 'Noleggio furgone + carburante',
          importo: 6514,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        },
        {
          categoria: 'OMBRELLI',
          descrizione: 'Acquisto ombrelli personalizzati',
          importo: 3600,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        },
        {
          categoria: 'STAZIONI',
          descrizione: 'Realizzazione rastrelliere',
          importo: 5000,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: false
        },
        {
          categoria: 'MARKETING',
          descrizione: 'Promozione locale e materiali',
          importo: 3000,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        },
        {
          categoria: 'PERMESSI',
          descrizione: 'Permessi, assicurazioni, manutenzioni',
          importo: 2500,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        },
        {
          categoria: 'PERDITE',
          descrizione: 'Fondo perdite/danni ombrelli',
          importo: 300,
          cadenza: 'ANNUALE',
          data_competenza: '2025-01-01',
          ricorrente: true
        }
      ]);
    
    if (costiError) handleSupabaseError(costiError, 'Insert sample costi');
  }
}));
