import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
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

interface BrelloState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  
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
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentLotto: (lotto: Lotto) => void;
  
  // CRUD Operations
  addCliente: (cliente: Omit<Cliente, 'id' | 'created_at'>) => void;
  updateCliente: (id: string, updates: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;
  
  addOpportunita: (opportunita: Omit<Opportunita, 'id' | 'created_at'>) => void;
  updateOpportunita: (id: string, updates: Partial<Opportunita>) => void;
  updateOpportunitaFase: (id: string, fase: Opportunita['fase']) => void;
  deleteOpportunita: (id: string) => void;
  
  addCostItem: (cost: Omit<CostItem, 'id' | 'created_at'>) => void;
  updateCostItem: (id: string, updates: Partial<CostItem>) => void;
  deleteCostItem: (id: string) => void;
  
  addMovimentoCassa: (movimento: Omit<MovimentoCassa, 'id' | 'created_at'>) => void;
  updateMovimentoCassa: (id: string, updates: Partial<MovimentoCassa>) => void;
  
  // Business Logic
  calculateDashboardData: () => DashboardData | null;
  calculatePreventivatoreResult: (request: any) => PreventivatoreResult;
  calculateScenario: (params: ScenarioParams, nome: string) => ScenarioResult;
  
  // Data Initialization
  initializeData: () => void;
}

// Sample data generation
const generateSampleData = () => {
  const now = new Date().toISOString();
  
  // Sample clients
  const clienti: Cliente[] = [
    {
      id: '1',
      ragione_sociale: 'Bar Centrale Alatri',
      piva_codfisc: '12345678901',
      categoria: 'PMI_LOCALE',
      contatti: {
        email: 'info@barcentrale.it',
        telefono: '0775123456',
        indirizzo: 'Piazza Regina Margherita 1, Alatri',
        referente: 'Mario Rossi'
      },
      attivo: true,
      created_at: now
    },
    {
      id: '2',
      ragione_sociale: 'Farmacia San Francesco',
      piva_codfisc: '98765432109',
      categoria: 'PMI_LOCALE',
      contatti: {
        email: 'farmacia@sanfrancesco.it',
        telefono: '0775654321',
        indirizzo: 'Via Roma 45, Alatri',
        referente: 'Dott.ssa Bianchi'
      },
      attivo: true,
      created_at: now
    },
    {
      id: '3',
      ragione_sociale: 'Banca Popolare del Lazio',
      piva_codfisc: '11223344556',
      categoria: 'PMI_REGIONALE',
      contatti: {
        email: 'marketing@bpl.it',
        telefono: '0775111222',
        indirizzo: 'Corso della Repubblica 12, Alatri',
        referente: 'Ing. Verdi'
      },
      attivo: true,
      created_at: now
    },
    {
      id: '4',
      ragione_sociale: 'Comune di Alatri',
      piva_codfisc: '80001234567',
      categoria: 'ISTITUZIONALE',
      contatti: {
        email: 'comunicazione@comune.alatri.fr.it',
        telefono: '0775434343',
        indirizzo: 'Piazza Santa Maria Maggiore 1, Alatri',
        referente: 'Assessore Cultura'
      },
      attivo: true,
      created_at: now
    }
  ];
  
  // Sample lotto 2025-Q4-AL
  const lotti: Lotto[] = [
    {
      id: 'lotto-2025-q4-al',
      codice_lotto: '2025-Q4-AL',
      citta: 'Alatri',
      periodo_start: '2025-10-01',
      periodo_end: '2025-12-31',
      inventario_spazi: 18,
      stazioni_tot: 10,
      stato: 'PREVENDITA',
      soglia_go_nogo: 70,
      target_ricavo: 19300,
      created_at: now
    }
  ];
  
  // Sample spazi - 16 venduti (6 Standard, 8 Plus, 2 Premium), 2 invenduti
  const spazi: Spazio[] = [];
  let spazioCounter = 1;
  
  // 6 Standard venduti
  for (let i = 0; i < 6; i++) {
    spazi.push({
      id: `spazio-${spazioCounter}`,
      lotto_id: 'lotto-2025-q4-al',
      numero_spazio: spazioCounter,
      tipo: 'STANDARD',
      prezzo_listino: 900,
      sconto_perc: 0,
      prezzo_netto: 900,
      stato: 'VENDUTO',
      cliente_id: i < 2 ? '1' : i < 4 ? '2' : '4',
      contratto_id: `contratto-${i + 1}`
    });
    spazioCounter++;
  }
  
  // 8 Plus venduti
  for (let i = 0; i < 8; i++) {
    spazi.push({
      id: `spazio-${spazioCounter}`,
      lotto_id: 'lotto-2025-q4-al',
      numero_spazio: spazioCounter,
      tipo: 'PLUS',
      prezzo_listino: 1100,
      sconto_perc: i < 2 ? 5 : 0, // 5% discount for first 2
      prezzo_netto: i < 2 ? 1045 : 1100,
      stato: 'VENDUTO',
      cliente_id: i < 3 ? '2' : i < 6 ? '3' : '1',
      contratto_id: `contratto-${i + 7}`
    });
    spazioCounter++;
  }
  
  // 2 Premium venduti
  for (let i = 0; i < 2; i++) {
    spazi.push({
      id: `spazio-${spazioCounter}`,
      lotto_id: 'lotto-2025-q4-al',
      numero_spazio: spazioCounter,
      tipo: 'PREMIUM',
      prezzo_listino: 1500,
      sconto_perc: 0,
      prezzo_netto: 1500,
      stato: 'VENDUTO',
      cliente_id: '3',
      contratto_id: `contratto-${i + 15}`
    });
    spazioCounter++;
  }
  
  // 2 invenduti
  for (let i = 0; i < 2; i++) {
    spazi.push({
      id: `spazio-${spazioCounter}`,
      lotto_id: 'lotto-2025-q4-al',
      numero_spazio: spazioCounter,
      tipo: 'STANDARD',
      prezzo_listino: 900,
      sconto_perc: 0,
      prezzo_netto: 900,
      stato: 'LIBERO'
    });
    spazioCounter++;
  }
  
  // Sample stazioni - 7 vendute, 3 libere
  const stazioni: SponsorshipStazione[] = [];
  for (let i = 1; i <= 10; i++) {
    stazioni.push({
      id: `stazione-${i}`,
      lotto_id: 'lotto-2025-q4-al',
      numero_stazione: i,
      prezzo_listino_lotto: 900,
      sconto_perc: 0,
      prezzo_netto: 900,
      stato: i <= 7 ? 'VENDUTA' : 'LIBERA',
      cliente_id: i <= 7 ? (i <= 3 ? '1' : i <= 5 ? '2' : '3') : undefined,
      contratto_id: i <= 7 ? `contratto-stazione-${i}` : undefined
    });
  }
  
  // Sample opportunità
  const opportunita: Opportunita[] = [
    {
      id: 'opp-1',
      cliente_id: '1',
      lotto_id: 'lotto-2025-q4-al',
      oggetto: 'Spazio Plus Autunno 2025',
      tipo: 'SPAZIO',
      valore_previsto: 1100,
      fase: 'LEAD',
      probabilita_perc: 30,
      data_chiusura_prevista: '2025-09-15',
      note: 'Interessato a visibilità durante eventi autunnali',
      created_at: now
    },
    {
      id: 'opp-2',
      cliente_id: '2',
      lotto_id: 'lotto-2025-q4-al',
      oggetto: 'Sponsorship Stazione Centro',
      tipo: 'STAZIONE',
      valore_previsto: 900,
      fase: 'QUALIFICA',
      probabilita_perc: 60,
      data_chiusura_prevista: '2025-09-20',
      created_at: now
    },
    {
      id: 'opp-3',
      cliente_id: '3',
      lotto_id: 'lotto-2025-q4-al',
      oggetto: 'Pacchetto Premium + Stazione',
      tipo: 'MISTO',
      valore_previsto: 2400,
      fase: 'OFFERTA',
      probabilita_perc: 80,
      data_chiusura_prevista: '2025-09-25',
      created_at: now
    }
  ];
  
  // Sample costi annui (€46,200 totali)
  const costi: CostItem[] = [
    {
      id: 'cost-1',
      categoria: 'PERSONALE',
      descrizione: 'Stipendio operatore + contributi',
      importo: 25800,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    },
    {
      id: 'cost-2',
      categoria: 'VEICOLO',
      descrizione: 'Noleggio furgone + carburante',
      importo: 6514,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    },
    {
      id: 'cost-3',
      categoria: 'OMBRELLI',
      descrizione: 'Acquisto ombrelli personalizzati',
      importo: 3600,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    },
    {
      id: 'cost-4',
      categoria: 'STAZIONI',
      descrizione: 'Realizzazione rastrelliere',
      importo: 5000,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: false,
      created_at: now
    },
    {
      id: 'cost-5',
      categoria: 'MARKETING',
      descrizione: 'Promozione locale e materiali',
      importo: 3000,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    },
    {
      id: 'cost-6',
      categoria: 'PERMESSI',
      descrizione: 'Permessi, assicurazioni, manutenzioni',
      importo: 2500,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    },
    {
      id: 'cost-7',
      categoria: 'PERDITE',
      descrizione: 'Fondo perdite/danni ombrelli',
      importo: 300,
      cadenza: 'ANNUALE',
      data_competenza: '2025-01-01',
      ricorrente: true,
      created_at: now
    }
  ];
  
  return {
    clienti,
    lotti,
    spazi,
    stazioni,
    opportunita,
    costi,
    contratti: [],
    movimenti_cassa: [],
    kpi_snapshots: []
  };
};

export const useBrelloStore = create<BrelloState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
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
      
      // Auth actions
      login: async (email: string, password: string) => {
        // Simple demo authentication
        const users: User[] = [
          { id: '1', email: 'admin@brello.it', nome: 'Admin', cognome: 'User', ruolo: 'admin', attivo: true },
          { id: '2', email: 'sales@brello.it', nome: 'Sales', cognome: 'Manager', ruolo: 'sales', attivo: true },
          { id: '3', email: 'finance@brello.it', nome: 'Finance', cognome: 'Controller', ruolo: 'finance', attivo: true },
          { id: '4', email: 'viewer@brello.it', nome: 'View', cognome: 'Only', ruolo: 'viewer', attivo: true }
        ];
        
        const user = users.find(u => u.email === email);
        if (user && password === 'demo123') {
          set({ currentUser: user, isAuthenticated: true });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },
      
      setCurrentLotto: (lotto: Lotto) => {
        set({ currentLotto: lotto });
      },
      
      // CRUD operations
      addCliente: (clienteData) => {
        const cliente: Cliente = {
          ...clienteData,
          id: `cliente-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        set(state => ({ clienti: [...state.clienti, cliente] }));
      },
      
      updateCliente: (id, updates) => {
        set(state => ({
          clienti: state.clienti.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
      },
      
      deleteCliente: (id) => {
        set(state => ({
          clienti: state.clienti.filter(c => c.id !== id)
        }));
      },
      
      addOpportunita: (oppData) => {
        const opportunita: Opportunita = {
          ...oppData,
          id: `opp-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        set(state => ({ opportunita: [...state.opportunita, opportunita] }));
      },
      
      updateOpportunita: (id, updates) => {
        set(state => ({
          opportunita: state.opportunita.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
      },
      
      updateOpportunitaFase: (id, fase) => {
        set(state => ({
          opportunita: state.opportunita.map(o => o.id === id ? { ...o, fase } : o)
        }));
      },
      
      deleteOpportunita: (id) => {
        set(state => ({
          opportunita: state.opportunita.filter(o => o.id !== id)
        }));
      },
      
      addCostItem: (costData) => {
        const cost: CostItem = {
          ...costData,
          id: `cost-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        set(state => ({ costi: [...state.costi, cost] }));
      },
      
      updateCostItem: (id, updates) => {
        set(state => ({
          costi: state.costi.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
      },
      
      deleteCostItem: (id) => {
        set(state => ({
          costi: state.costi.filter(c => c.id !== id)
        }));
      },
      
      addMovimentoCassa: (movimentoData) => {
        const movimento: MovimentoCassa = {
          ...movimentoData,
          id: `mov-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        set(state => ({ movimenti_cassa: [...state.movimenti_cassa, movimento] }));
      },
      
      updateMovimentoCassa: (id, updates) => {
        set(state => ({
          movimenti_cassa: state.movimenti_cassa.map(m => m.id === id ? { ...m, ...updates } : m)
        }));
      },
      
      // Business logic calculations
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
        const costoLottoAllocato = state.costi.reduce((sum, c) => sum + c.importo, 0) / 3; // Diviso per 3 lotti/anno
        
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
        
        // Base calculations per lotto
        const ricavoBaseLotto = 19300; // From target
        const prezzoMedioBase = ricavoBaseLotto / 16; // 16 spazi venduti in media
        
        // Apply scenario parameters
        const nuovoPrezzoMedio = prezzoMedioBase * (1 + params.prezzo_medio_variazione / 100);
        const nuoviCostiAnnui = costiAnnuiBase * (1 + params.costi_variazione / 100);
        
        // Calculate spaces sold based on occupancy
        const spaziVenduti = Math.round((params.occupancy_spazi_perc / 100) * 18);
        const stazioniVendute = Math.round((params.occupancy_stazioni_perc / 100) * 10);
        
        // Revenue calculation
        const ricavoSpaziLotto = spaziVenduti * nuovoPrezzoMedio;
        const ricavoStazioniLotto = stazioniVendute * 900; // Stazioni always €900
        const ricavoLotto = ricavoSpaziLotto + ricavoStazioniLotto;
        const ricaviAnnui = ricavoLotto * 3; // 3 lotti/anno
        
        const margineAnnuo = ricaviAnnui - nuoviCostiAnnui;
        const marginePerc = ricaviAnnui > 0 ? (margineAnnuo / ricaviAnnui) * 100 : 0;
        
        // Base scenario for comparison (current dashboard data)
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
      initializeData: () => {
        const sampleData = generateSampleData();
        set({
          ...sampleData,
          currentLotto: sampleData.lotti[0]
        });
        
        // Calculate initial dashboard data
        setTimeout(() => {
          get().calculateDashboardData();
        }, 100);
      }
    }),
    {
      name: 'brello-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        clienti: state.clienti,
        lotti: state.lotti,
        spazi: state.spazi,
        stazioni: state.stazioni,
        opportunita: state.opportunita,
        contratti: state.contratti,
        costi: state.costi,
        movimenti_cassa: state.movimenti_cassa,
        kpi_snapshots: state.kpi_snapshots,
        currentLotto: state.currentLotto
      })
    }
  )
);