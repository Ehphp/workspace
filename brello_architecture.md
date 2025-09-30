# Architettura Software - Brellò Sales & Finance Cockpit

## 1. Panoramica Architetturale

### 1.1 Approccio di Implementazione

**Analisi dei Punti Critici:**
- **Complessità del Modello Dati**: 8 entità principali con relazioni complesse e calcoli finanziari in tempo reale
- **Sistema Go/No-Go Critico**: Automazioni business-critical per soglie di pre-vendita con alert temporizzati
- **Multi-Ruolo Authorization**: Sistema granulare di permessi per 4 tipologie utente (Admin, Sales, Finance, Viewer)
- **Performance Real-Time**: Dashboard KPI con aggiornamenti live e calcoli margini istantanei
- **Scalabilità Multi-Città**: Architettura preparata per espansione geografica futura

**Framework Selezionati:**
- **Frontend**: Next.js 14 con App Router per SSR/SSG ottimizzato
- **UI Framework**: Shadcn/ui + Tailwind CSS per design system consistente
- **Backend**: Node.js + Fastify per performance API superiori
- **Database**: PostgreSQL con Redis per caching real-time
- **Real-time**: Socket.io per aggiornamenti dashboard live
- **File Processing**: Puppeteer per PDF generation, Fast-CSV per export

### 1.2 Architettura High-Level

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App Next.js]
        MOB[Mobile PWA]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx + Rate Limiting]
        LB[Load Balancer]
    end
    
    subgraph "Application Layer"
        API[Fastify API Server]
        AUTH[Auth Service]
        CALC[Calculation Engine]
        NOTIF[Notification Service]
        SCHED[Scheduler Service]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
        FILES[File Storage]
    end
    
    subgraph "External Services"
        EMAIL[Email Service]
        PDF[PDF Generator]
        BACKUP[Backup Service]
    end
    
    WEB --> NGINX
    MOB --> NGINX
    NGINX --> LB
    LB --> API
    API --> AUTH
    API --> CALC
    API --> NOTIF
    API --> PG
    API --> REDIS
    SCHED --> NOTIF
    NOTIF --> EMAIL
    API --> PDF
    PG --> BACKUP
```

## 2. Strutture Dati e Interfacce

### 2.1 Schema Database PostgreSQL

```sql
-- Configurazione database ottimizzata per performance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabella Utenti e Autenticazione
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('admin', 'sales', 'finance', 'viewer');

-- Tabella Clienti con indici ottimizzati
CREATE TABLE clienti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ragione_sociale VARCHAR(255) NOT NULL,
    piva_codfisc VARCHAR(50) UNIQUE NOT NULL,
    categoria cliente_categoria NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    indirizzo TEXT,
    referente VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE cliente_categoria AS ENUM ('PMI_LOCALE', 'PMI_REGIONALE', 'PMI_NAZIONALE', 'ISTITUZIONALE');

-- Indici per performance
CREATE INDEX idx_clienti_categoria ON clienti(categoria);
CREATE INDEX idx_clienti_ragione_sociale_trgm ON clienti USING gin(ragione_sociale gin_trgm_ops);
CREATE INDEX idx_clienti_piva ON clienti(piva_codfisc);

-- Tabella Lotti con constraints business
CREATE TABLE lotti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codice_lotto VARCHAR(50) UNIQUE NOT NULL,
    citta VARCHAR(100) NOT NULL,
    periodo_start DATE NOT NULL,
    periodo_end DATE NOT NULL,
    inventario_spazi INTEGER DEFAULT 18 CHECK (inventario_spazi > 0),
    stazioni_tot INTEGER DEFAULT 10 CHECK (stazioni_tot > 0),
    stato lotto_stato DEFAULT 'PREVENDITA',
    soglia_go_nogo DECIMAL(5,2) DEFAULT 70.00 CHECK (soglia_go_nogo BETWEEN 0 AND 100),
    target_ricavo DECIMAL(10,2) DEFAULT 19300.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_periodo CHECK (periodo_end > periodo_start)
);

CREATE TYPE lotto_stato AS ENUM ('PREVENDITA', 'ATTIVO', 'CHIUSO');

-- Indici per query frequenti
CREATE INDEX idx_lotti_stato ON lotti(stato);
CREATE INDEX idx_lotti_periodo ON lotti(periodo_start, periodo_end);
CREATE INDEX idx_lotti_citta ON lotti(citta);

-- Tabella Spazi con foreign key e constraints
CREATE TABLE spazi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lotto_id UUID NOT NULL REFERENCES lotti(id) ON DELETE CASCADE,
    tipo spazio_tipo NOT NULL,
    prezzo_listino DECIMAL(10,2) NOT NULL CHECK (prezzo_listino > 0),
    sconto_perc DECIMAL(5,2) DEFAULT 0 CHECK (sconto_perc BETWEEN 0 AND 100),
    prezzo_netto DECIMAL(10,2) GENERATED ALWAYS AS (prezzo_listino * (1 - sconto_perc/100)) STORED,
    stato spazio_stato DEFAULT 'LIBERO',
    cliente_id UUID REFERENCES clienti(id),
    contratto_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE spazio_tipo AS ENUM ('STANDARD', 'PLUS', 'PREMIUM');
CREATE TYPE spazio_stato AS ENUM ('LIBERO', 'OPZIONATO', 'VENDUTO', 'INVENDUTO');

-- Indici per performance query
CREATE INDEX idx_spazi_lotto_id ON spazi(lotto_id);
CREATE INDEX idx_spazi_stato ON spazi(stato);
CREATE INDEX idx_spazi_tipo ON spazi(tipo);
CREATE INDEX idx_spazi_cliente_id ON spazi(cliente_id);

-- Tabella Sponsorship Stazioni
CREATE TABLE sponsorship_stazioni (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lotto_id UUID NOT NULL REFERENCES lotti(id) ON DELETE CASCADE,
    numero_stazione INTEGER NOT NULL,
    prezzo_listino_lotto DECIMAL(10,2) DEFAULT 900.00,
    sconto_perc DECIMAL(5,2) DEFAULT 0 CHECK (sconto_perc BETWEEN 0 AND 100),
    prezzo_netto DECIMAL(10,2) GENERATED ALWAYS AS (prezzo_listino_lotto * (1 - sconto_perc/100)) STORED,
    stato stazione_stato DEFAULT 'LIBERA',
    cliente_id UUID REFERENCES clienti(id),
    contratto_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lotto_id, numero_stazione)
);

CREATE TYPE stazione_stato AS ENUM ('LIBERA', 'OPZIONATA', 'VENDUTA');

-- Tabella Opportunità con tracking pipeline
CREATE TABLE opportunita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clienti(id),
    lotto_id UUID NOT NULL REFERENCES lotti(id),
    oggetto VARCHAR(255) NOT NULL,
    tipo opportunita_tipo NOT NULL,
    valore_previsto DECIMAL(10,2) NOT NULL CHECK (valore_previsto >= 0),
    fase opportunita_fase DEFAULT 'LEAD',
    probabilita_perc INTEGER DEFAULT 50 CHECK (probabilita_perc BETWEEN 0 AND 100),
    data_chiusura_prevista DATE,
    note TEXT,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE opportunita_tipo AS ENUM ('SPAZIO', 'STAZIONE', 'MISTO');
CREATE TYPE opportunita_fase AS ENUM ('LEAD', 'QUALIFICA', 'OFFERTA', 'CHIUSURA');

-- Indici per pipeline performance
CREATE INDEX idx_opportunita_fase ON opportunita(fase);
CREATE INDEX idx_opportunita_lotto_id ON opportunita(lotto_id);
CREATE INDEX idx_opportunita_cliente_id ON opportunita(cliente_id);
CREATE INDEX idx_opportunita_assigned_to ON opportunita(assigned_to);

-- Tabella Contratti con righe dettagliate
CREATE TABLE contratti (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_contratto VARCHAR(100) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clienti(id),
    lotto_id UUID NOT NULL REFERENCES lotti(id),
    ricavo_totale DECIMAL(10,2) NOT NULL CHECK (ricavo_totale >= 0),
    termini_pagamento VARCHAR(255),
    date_incasso_previste DATE[],
    stato contratto_stato DEFAULT 'BOZZA',
    pdf_path VARCHAR(500),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE contratto_stato AS ENUM ('BOZZA', 'INVIATO', 'FIRMATO', 'INCASSATO');

-- Tabella Righe Contratto
CREATE TABLE contratto_righe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contratto_id UUID NOT NULL REFERENCES contratti(id) ON DELETE CASCADE,
    tipo riga_tipo NOT NULL,
    spazio_id UUID REFERENCES spazi(id),
    stazione_id UUID REFERENCES sponsorship_stazioni(id),
    quantita INTEGER DEFAULT 1 CHECK (quantita > 0),
    prezzo_unitario DECIMAL(10,2) NOT NULL CHECK (prezzo_unitario >= 0),
    sconto_perc DECIMAL(5,2) DEFAULT 0 CHECK (sconto_perc BETWEEN 0 AND 100),
    totale_riga DECIMAL(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario * (1 - sconto_perc/100)) STORED
);

CREATE TYPE riga_tipo AS ENUM ('SPAZIO', 'STAZIONE');

-- Tabella Costi con categorizzazione
CREATE TABLE cost_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lotto_id UUID REFERENCES lotti(id), -- NULL per costi annui
    categoria cost_categoria NOT NULL,
    descrizione VARCHAR(255) NOT NULL,
    importo DECIMAL(10,2) NOT NULL CHECK (importo >= 0),
    cadenza cost_cadenza NOT NULL,
    data_competenza DATE NOT NULL,
    is_variabile BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE cost_categoria AS ENUM ('PERSONALE', 'VEICOLO', 'OMBRELLI', 'STAZIONI', 'MARKETING', 'PERMESSI', 'PERDITE', 'ALTRO');
CREATE TYPE cost_cadenza AS ENUM ('UNA_TANTUM', 'MENSILE', 'LOTTO', 'ANNUALE');

-- Tabella Movimenti Cassa
CREATE TABLE movimenti_cassa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data DATE NOT NULL,
    tipo movimento_tipo NOT NULL,
    importo DECIMAL(10,2) NOT NULL CHECK (importo != 0),
    cliente_fornitore VARCHAR(255),
    riferimento_contratto_id UUID REFERENCES contratti(id),
    riferimento_costo_id UUID REFERENCES cost_items(id),
    stato movimento_stato DEFAULT 'PREVISTO',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE movimento_tipo AS ENUM ('INCASSO', 'PAGAMENTO');
CREATE TYPE movimento_stato AS ENUM ('PREVISTO', 'INCASSATO', 'PAGATO');

-- Tabella KPI Snapshots per analytics
CREATE TABLE kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lotto_id UUID NOT NULL REFERENCES lotti(id),
    data_snapshot DATE NOT NULL,
    occupancy_spazi_perc DECIMAL(5,2),
    occupancy_stazioni_perc DECIMAL(5,2),
    ricavo_lotto DECIMAL(10,2),
    costo_lotto DECIMAL(10,2),
    margine_lotto DECIMAL(10,2),
    margine_perc DECIMAL(5,2),
    lead_to_close_perc DECIMAL(5,2),
    cac_per_segmento JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lotto_id, data_snapshot)
);

-- Tabella Audit Log per compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indici per audit e compliance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Tabella Notifiche e Alert
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('GO_NOGO_ALERT', 'PAYMENT_REMINDER', 'RENEWAL_OPPORTUNITY', 'SYSTEM_ALERT');

-- Funzioni e Trigger per automazioni
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per updated_at automatico
CREATE TRIGGER update_clienti_updated_at BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lotti_updated_at BEFORE UPDATE ON lotti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spazi_updated_at BEFORE UPDATE ON spazi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunita_updated_at BEFORE UPDATE ON opportunita FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratti_updated_at BEFORE UPDATE ON contratti FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 API Layer Architecture

```typescript
// Struttura API RESTful con validazione Zod
import { z } from 'zod';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// Schema validazione per entità principali
export const ClienteSchema = z.object({
  ragione_sociale: z.string().min(2).max(255),
  piva_codfisc: z.string().regex(/^[A-Z0-9]{11,16}$/),
  categoria: z.enum(['PMI_LOCALE', 'PMI_REGIONALE', 'PMI_NAZIONALE', 'ISTITUZIONALE']),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  indirizzo: z.string().optional(),
  referente: z.string().optional(),
  note: z.string().optional()
});

export const LottoSchema = z.object({
  codice_lotto: z.string().regex(/^\d{4}-Q[1-4]-[A-Z]{2,3}$/),
  citta: z.string().min(2).max(100),
  periodo_start: z.string().datetime(),
  periodo_end: z.string().datetime(),
  inventario_spazi: z.number().int().min(1).default(18),
  stazioni_tot: z.number().int().min(1).default(10),
  soglia_go_nogo: z.number().min(0).max(100).default(70),
  target_ricavo: z.number().positive().default(19300)
});

// Interfacce TypeScript per type safety
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KPIDashboard {
  lotto_corrente: {
    id: string;
    codice: string;
    occupancy_spazi: number;
    occupancy_stazioni: number;
    ricavo_attuale: number;
    target_ricavo: number;
    giorni_rimanenti: number;
    go_nogo_status: 'GO' | 'WARNING' | 'NO_GO';
  };
  funnel_vendite: {
    lead: number;
    qualifica: number;
    offerta: number;
    chiusura: number;
    conversion_rate: number;
  };
  margine_ytd: {
    attuale: number;
    target: number;
    percentuale: number;
  };
  break_even: {
    soglia_annua: number;
    ricavi_ytd: number;
    percentuale_raggiunta: number;
  };
  cash_runway: {
    saldo_attuale: number;
    burn_rate_mensile: number;
    mesi_copertura: number;
  };
}

// Middleware per autorizzazioni
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'sales' | 'finance' | 'viewer';
    permissions: string[];
  };
}

export const authorize = (requiredPermission: string) => {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user.permissions.includes(requiredPermission) && 
        !request.user.permissions.includes('*')) {
      return reply.status(403).send({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
  };
};

// Controller per calcoli finanziari real-time
export class CalculationController {
  
  async calcolaRicavoLotto(lotto_id: string): Promise<number> {
    const spazi_venduti = await this.db.spazi.findMany({
      where: { lotto_id, stato: 'VENDUTO' }
    });
    
    const stazioni_vendute = await this.db.sponsorship_stazioni.findMany({
      where: { lotto_id, stato: 'VENDUTA' }
    });
    
    const ricavo_spazi = spazi_venduti.reduce((sum, spazio) => 
      sum + spazio.prezzo_netto, 0
    );
    
    const ricavo_stazioni = stazioni_vendute.reduce((sum, stazione) => 
      sum + stazione.prezzo_netto, 0
    );
    
    return ricavo_spazi + ricavo_stazioni;
  }
  
  async calcolaOccupancy(lotto_id: string): Promise<{spazi: number, stazioni: number}> {
    const lotto = await this.db.lotti.findUnique({ where: { id: lotto_id } });
    if (!lotto) throw new Error('Lotto not found');
    
    const spazi_venduti = await this.db.spazi.count({
      where: { lotto_id, stato: 'VENDUTO' }
    });
    
    const stazioni_vendute = await this.db.sponsorship_stazioni.count({
      where: { lotto_id, stato: 'VENDUTA' }
    });
    
    return {
      spazi: (spazi_venduti / lotto.inventario_spazi) * 100,
      stazioni: (stazioni_vendute / lotto.stazioni_tot) * 100
    };
  }
  
  async calcolaMargine(lotto_id: string): Promise<{margine: number, margine_perc: number}> {
    const ricavo = await this.calcolaRicavoLotto(lotto_id);
    const costo = await this.calcolaCostoLotto(lotto_id);
    const margine = ricavo - costo;
    
    return {
      margine: margine,
      margine_perc: ricavo > 0 ? (margine / ricavo) * 100 : 0
    };
  }
  
  async verificaGoNoGo(lotto_id: string): Promise<GoNoGoStatus> {
    const lotto = await this.db.lotti.findUnique({ where: { id: lotto_id } });
    if (!lotto) throw new Error('Lotto not found');
    
    const occupancy = await this.calcolaOccupancy(lotto_id);
    const giorni_rimanenti = Math.ceil(
      (new Date(lotto.periodo_start).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let status: 'GO' | 'WARNING' | 'NO_GO' = 'GO';
    let blocco_stampa = false;
    
    if (occupancy.spazi < lotto.soglia_go_nogo) {
      if (giorni_rimanenti <= 14) {
        status = 'NO_GO';
        blocco_stampa = true;
      } else if (giorni_rimanenti <= 30) {
        status = 'WARNING';
      }
    }
    
    return {
      lotto_id,
      occupancy_attuale: occupancy.spazi,
      soglia_richiesta: lotto.soglia_go_nogo,
      giorni_rimanenti,
      status,
      blocco_stampa,
      alert_inviato: await this.checkAlertInviato(lotto_id)
    };
  }
}

// Routes API con validazione e caching
export async function registerRoutes(fastify: FastifyInstance) {
  
  // Dashboard KPI con caching Redis
  fastify.get('/api/v1/dashboard', {
    preHandler: [fastify.authenticate, authorize('dashboard:read')]
  }, async (request: AuthenticatedRequest, reply) => {
    
    const cacheKey = `dashboard:${request.user.id}`;
    const cached = await fastify.redis.get(cacheKey);
    
    if (cached) {
      return reply.send(JSON.parse(cached));
    }
    
    const dashboard = await generateDashboardKPI(request.user);
    
    await fastify.redis.setex(cacheKey, 300, JSON.stringify(dashboard)); // 5min cache
    
    return reply.send(dashboard);
  });
  
  // Pipeline Kanban con real-time updates
  fastify.get('/api/v1/opportunita', {
    preHandler: [fastify.authenticate, authorize('opportunita:read')]
  }, async (request: AuthenticatedRequest, reply) => {
    
    const { lotto_id, fase } = request.query as any;
    
    const opportunita = await fastify.db.opportunita.findMany({
      where: {
        ...(lotto_id && { lotto_id }),
        ...(fase && { fase }),
        ...(request.user.role === 'sales' && { assigned_to: request.user.id })
      },
      include: {
        cliente: true,
        lotto: true
      },
      orderBy: { updated_at: 'desc' }
    });
    
    return reply.send({
      success: true,
      data: opportunita
    });
  });
  
  // Preventivatore con calcoli real-time
  fastify.post('/api/v1/preventivatore/calcola', {
    preHandler: [fastify.authenticate, authorize('preventivatore:create')],
    schema: {
      body: z.object({
        lotto_id: z.string().uuid(),
        spazi: z.array(z.object({
          tipo: z.enum(['STANDARD', 'PLUS', 'PREMIUM']),
          quantita: z.number().int().min(1),
          sconto_perc: z.number().min(0).max(100).default(0)
        })),
        stazioni: z.array(z.object({
          quantita: z.number().int().min(1),
          sconto_perc: z.number().min(0).max(100).default(0)
        })).optional()
      })
    }
  }, async (request: AuthenticatedRequest, reply) => {
    
    const { lotto_id, spazi, stazioni = [] } = request.body as any;
    
    const preventivo = await fastify.calculationService.calcolaPreventivo({
      lotto_id,
      spazi,
      stazioni
    });
    
    return reply.send({
      success: true,
      data: preventivo
    });
  });
  
  // Export PDF con generazione asincrona
  fastify.get('/api/v1/contratti/:id/pdf', {
    preHandler: [fastify.authenticate, authorize('contratti:read')]
  }, async (request: AuthenticatedRequest, reply) => {
    
    const { id } = request.params as any;
    
    const contratto = await fastify.db.contratti.findUnique({
      where: { id },
      include: {
        cliente: true,
        lotto: true,
        righe: true
      }
    });
    
    if (!contratto) {
      return reply.status(404).send({
        success: false,
        error: 'Contratto non trovato'
      });
    }
    
    const pdfBuffer = await fastify.pdfService.generateContrattoPDF(contratto);
    
    reply.type('application/pdf');
    return reply.send(pdfBuffer);
  });
}

// WebSocket per real-time updates
export class RealtimeService {
  
  constructor(private io: any) {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    
    // Aggiornamenti KPI dashboard
    this.io.on('connection', (socket: any) => {
      
      socket.on('subscribe:dashboard', (userId: string) => {
        socket.join(`dashboard:${userId}`);
      });
      
      socket.on('subscribe:pipeline', (lottoId: string) => {
        socket.join(`pipeline:${lottoId}`);
      });
    });
  }
  
  async broadcastKPIUpdate(lottoId: string, kpi: any) {
    this.io.to(`dashboard:all`).emit('kpi:updated', {
      lotto_id: lottoId,
      data: kpi
    });
  }
  
  async broadcastPipelineUpdate(lottoId: string, opportunita: any) {
    this.io.to(`pipeline:${lottoId}`).emit('pipeline:updated', {
      lotto_id: lottoId,
      opportunita
    });
  }
  
  async broadcastGoNoGoAlert(lottoId: string, status: any) {
    this.io.emit('go-nogo:alert', {
      lotto_id: lottoId,
      status,
      timestamp: new Date()
    });
  }
}
```

## 3. Flusso di Chiamate del Programma

### 3.1 Sequence Diagram - Gestione Pipeline Vendite

```mermaid
sequenceDiagram
    participant U as User (Sales)
    participant F as Frontend Next.js
    participant A as API Gateway
    participant S as Fastify Server
    participant C as Calculation Engine
    participant D as PostgreSQL
    participant R as Redis Cache
    participant W as WebSocket

    U->>F: Accede a Pipeline Kanban
    F->>A: GET /api/v1/opportunita?lotto_id=xxx
    A->>S: Forward request + auth
    S->>R: Check cache pipeline:xxx
    
    alt Cache Hit
        R-->>S: Return cached data
    else Cache Miss
        S->>D: SELECT opportunita + JOIN cliente, lotto
        D-->>S: Return opportunities data
        S->>R: Cache result (TTL 5min)
    end
    
    S-->>A: Return opportunities
    A-->>F: JSON response
    F-->>U: Render Kanban board
    
    U->>F: Drag opportunity to "OFFERTA"
    F->>A: PUT /api/v1/opportunita/123/fase
    A->>S: Update opportunity fase
    S->>D: UPDATE opportunita SET fase='OFFERTA'
    D-->>S: Confirm update
    
    S->>C: Calculate updated KPIs
    C->>D: Query lotto metrics
    D-->>C: Return aggregated data
    C-->>S: Return calculated KPIs
    
    S->>W: Broadcast pipeline update
    W-->>F: Real-time notification
    F-->>U: Update UI without refresh
    
    S->>R: Invalidate related caches
    S-->>A: Success response
    A-->>F: 200 OK
```

### 3.2 Sequence Diagram - Sistema Go/No-Go Automatico

```mermaid
sequenceDiagram
    participant SCHED as Scheduler Service
    participant C as Calculation Engine
    participant D as PostgreSQL
    participant N as Notification Service
    participant E as Email Service
    participant W as WebSocket
    participant U as Users

    Note over SCHED: Daily cron job 09:00
    
    SCHED->>C: Check all active lotti
    C->>D: SELECT lotti WHERE stato='PREVENDITA'
    D-->>C: Return active lotti
    
    loop For each lotto
        C->>D: Calculate occupancy %
        D-->>C: Return spazi/stazioni venduti
        
        C->>C: Check giorni_rimanenti
        C->>C: Evaluate go/no-go rules
        
        alt Occupancy < 70% AND giorni <= 14
            C->>D: INSERT notification (NO_GO_ALERT)
            C->>N: Trigger alert notification
            N->>E: Send email to sales team
            N->>W: Broadcast real-time alert
            W-->>U: Show critical alert
            
        else Occupancy < 70% AND giorni <= 30
            C->>D: INSERT notification (WARNING)
            C->>N: Trigger warning notification
            N->>W: Broadcast warning
            W-->>U: Show warning badge
        end
        
        C->>D: UPDATE kpi_snapshots
    end
    
    SCHED-->>C: Job completed
```

### 3.3 Sequence Diagram - Preventivatore con Margini Real-time

```mermaid
sequenceDiagram
    participant U as User (Finance)
    participant F as Frontend
    participant A as API Gateway
    participant S as Fastify Server
    parameter C as Calculation Engine
    participant D as PostgreSQL
    participant PDF as PDF Service

    U->>F: Open Preventivatore
    F->>A: GET /api/v1/lotti/active
    A->>S: Get available lotti
    S->>D: SELECT lotti WHERE stato IN ('PREVENDITA','ATTIVO')
    D-->>S: Return lotti list
    S-->>F: Available lotti + pricing

    U->>F: Select spazi + modify sconto
    F->>A: POST /api/v1/preventivatore/calcola
    
    Note over F: Real-time calculation on input change
    
    A->>S: Calculate margins
    S->>C: Process calculation request
    C->>D: Get lotto pricing + cost allocation
    D-->>C: Return base prices + costs
    
    C->>C: Calculate ricavo_totale
    C->>C: Calculate costo_allocato
    C->>C: Calculate margine + margine_%
    
    C-->>S: Return calculation results
    S-->>A: Margin calculation response
    A-->>F: JSON with margins
    F-->>U: Update UI with live margins
    
    U->>F: Generate PDF offer
    F->>A: POST /api/v1/preventivatore/genera-pdf
    A->>S: Generate PDF request
    S->>PDF: Create PDF with calculations
    PDF->>PDF: Render HTML template
    PDF-->>S: Return PDF buffer
    S-->>A: PDF response
    A-->>F: PDF download
    F-->>U: Download PDF offer
```

### 3.4 Sequence Diagram - Scenario Planning

```mermaid
sequenceDiagram
    participant U as User (CEO)
    participant F as Frontend
    participant A as API Gateway
    participant S as Fastify Server
    participant C as Calculation Engine
    participant D as PostgreSQL

    U->>F: Access Scenario Planner
    F->>A: GET /api/v1/scenari/base-data
    A->>S: Get baseline metrics
    S->>D: Query current performance
    D-->>S: Return YTD data
    S-->>F: Baseline scenario data

    U->>F: Adjust sliders (occupancy ±, price ±, costs ±)
    
    Note over F: Real-time scenario calculation
    
    F->>A: POST /api/v1/scenari/simula
    A->>S: Simulate scenario
    S->>C: Calculate scenario impact
    
    C->>C: Apply occupancy_factor to ricavi
    C->>C: Apply price_factor to listini
    C->>C: Apply cost_factor to costi_annui
    C->>C: Calculate new margine_annuo
    C->>C: Calculate break_even_months
    
    C-->>S: Return scenario results
    S-->>A: Scenario comparison data
    A-->>F: JSON with Base/Best/Worst
    F-->>U: Update charts + comparison table
    
    U->>F: Save scenario
    F->>A: POST /api/v1/scenari-salvati
    A->>S: Save scenario configuration
    S->>D: INSERT scenario with parameters
    D-->>S: Confirm save
    S-->>F: Success response
```

## 4. Aspetti Non Chiari

### 4.1 Integrazione Sistemi Esterni

**Domanda**: È necessaria integrazione con software contabili esistenti (Fatture in Cloud, TeamSystem, Aruba)?
- **Impatto**: Richiede sviluppo connettori specifici e mapping dati
- **Raccomandazione**: Implementare export standardizzato (CSV/Excel) per import manuale iniziale, valutare API integration in Fase 2

**Domanda**: Serve integrazione con gateway di pagamento per incassi automatici?
- **Impatto**: Aggiunge complessità PCI compliance e riconciliazione automatica
- **Raccomandazione**: Gestione manuale movimenti cassa in MVP, integrazione Stripe/PayPal in versioni successive

### 4.2 Scalabilità Multi-Tenant

**Domanda**: L'architettura deve supportare multi-città da subito o single-tenant?
- **Impatto**: Database design diverso (schema per tenant vs shared schema)
- **Raccomandazione**: Architettura single-tenant ottimizzata, preparata per multi-tenant con campo `tenant_id`

**Domanda**: Gestione utenti e permessi cross-città?
- **Impatto**: Sistema autorizzazioni più complesso con scope geografico
- **Raccomandazione**: Role-based semplice in MVP, estensione territorial-based successiva

### 4.3 Compliance e Backup

**Domanda**: Requisiti specifici GDPR per dati clienti?
- **Impatto**: Implementazione right-to-be-forgotten, data portability, consent management
- **Raccomandazione**: Audit trail completo, soft delete, export dati personali

**Domanda**: RTO/RPO requirements per disaster recovery?
- **Impatto**: Strategia backup e replica database
- **Raccomandazione**: Backup giornaliero PostgreSQL, replica streaming per production

### 4.4 Performance e Concorrenza

**Domanda**: Numero utenti simultanei previsti?
- **Impatto**: Dimensionamento server e database connection pooling
- **Raccomandazione**: Architettura per 10-50 utenti simultanei, scalabile orizzontalmente

**Domanda**: Gestione conflitti su modifiche concorrenti (stesso contratto)?
- **Impatto**: Implementazione optimistic locking o pessimistic locking
- **Raccomandazione**: Optimistic locking con timestamp, notifica conflitti

## 5. Deployment e DevOps

### 5.1 Containerizzazione Docker

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8000
CMD ["node", "dist/server.js"]
```

### 5.2 Docker Compose per Development

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://brello:password@postgres:5432/brello_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=brello_db
      - POSTGRES_USER=brello
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 5.3 CI/CD Pipeline GitHub Actions

```yaml
name: Brellò Cockpit CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: brello/sales-finance-cockpit

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: brello_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Run linting
        run: |
          cd frontend && npm run lint
          cd ../backend && npm run lint

      - name: Run type checking
        run: |
          cd frontend && npm run type-check
          cd ../backend && npm run type-check

      - name: Run unit tests
        run: |
          cd frontend && npm run test:coverage
          cd ../backend && npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/brello_test
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: |
          cd frontend && npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/brello_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info,./backend/coverage/lcov.info

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: |
          cd frontend && npm audit --audit-level high
          cd ../backend && npm audit --audit-level high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker images
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    environment: production
    
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production server..."
          # Add deployment script here
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### 5.4 Monitoring e Observability

```typescript
// Prometheus metrics setup
import prometheus from 'prom-client';

export const metrics = {
  httpRequestDuration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
  }),

  httpRequestTotal: new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  }),

  activeUsers: new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
  }),

  pipelineConversions: new prometheus.Counter({
    name: 'pipeline_conversions_total',
    help: 'Total pipeline conversions',
    labelNames: ['from_stage', 'to_stage']
  }),

  goNoGoAlerts: new prometheus.Counter({
    name: 'go_nogo_alerts_total',
    help: 'Total go/no-go alerts triggered',
    labelNames: ['lotto_id', 'alert_type']
  }),

  marginCalculations: new prometheus.Histogram({
    name: 'margin_calculation_duration_seconds',
    help: 'Duration of margin calculations',
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  })
};

// Grafana Dashboard JSON
export const grafanaDashboard = {
  "dashboard": {
    "title": "Brellò Sales & Finance Cockpit",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_users_total"
          }
        ]
      },
      {
        "title": "Pipeline Conversions",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(pipeline_conversions_total[1h])",
            "legendFormat": "{{from_stage}} -> {{to_stage}}"
          }
        ]
      }
    ]
  }
};
```

### 5.5 Backup e Disaster Recovery

```bash
#!/bin/bash
# Backup script per PostgreSQL

BACKUP_DIR="/backups/brello"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="brello_db"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U brello -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Files backup (uploads, generated PDFs)
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /app/uploads /app/generated

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://brello-backups/database/
aws s3 cp $BACKUP_DIR/files_backup_$DATE.tar.gz s3://brello-backups/files/

# Cleanup old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

## 6. Sicurezza e Performance

### 6.1 Implementazione Sicurezza

```typescript
// Rate limiting configuration
import rateLimit from '@fastify/rate-limit';

export const rateLimitConfig = {
  global: {
    max: 100,
    timeWindow: '1 minute'
  },
  login: {
    max: 5,
    timeWindow: '15 minutes',
    skipSuccessfulRequests: true
  },
  api: {
    max: 1000,
    timeWindow: '1 hour'
  }
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '8h',
  refreshTokenExpiresIn: '7d'
};

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = schema.parse(request.body);
      request.body = validated;
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid input data',
        details: error.errors
      });
    }
  };
};

// SQL injection prevention
export const sanitizeQuery = (query: string): string => {
  return query.replace(/['"\\;]/g, '');
};

// CORS configuration
export const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

### 6.2 Ottimizzazioni Performance

```typescript
// Database connection pooling
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 2,
    max: 10,
    idle: 10000,
    acquire: 30000
  },
  logging: process.env.NODE_ENV === 'development'
};

// Redis caching strategy
export class CacheService {
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache warming per dashboard
  async warmDashboardCache(userId: string): Promise<void> {
    const dashboard = await this.generateDashboard(userId);
    await this.set(`dashboard:${userId}`, dashboard, 300);
  }
}

// Database query optimization
export const optimizedQueries = {
  
  // Materialized view per KPI aggregati
  createKPIMaterializedView: `
    CREATE MATERIALIZED VIEW mv_lotto_kpi AS
    SELECT 
      l.id as lotto_id,
      l.codice_lotto,
      COUNT(s.id) FILTER (WHERE s.stato = 'VENDUTO') as spazi_venduti,
      COUNT(s.id) as spazi_totali,
      COUNT(st.id) FILTER (WHERE st.stato = 'VENDUTA') as stazioni_vendute,
      COUNT(st.id) as stazioni_totali,
      COALESCE(SUM(s.prezzo_netto) FILTER (WHERE s.stato = 'VENDUTO'), 0) as ricavo_spazi,
      COALESCE(SUM(st.prezzo_netto) FILTER (WHERE st.stato = 'VENDUTA'), 0) as ricavo_stazioni,
      (COUNT(s.id) FILTER (WHERE s.stato = 'VENDUTO')::float / l.inventario_spazi * 100) as occupancy_spazi_perc,
      (COUNT(st.id) FILTER (WHERE st.stato = 'VENDUTA')::float / l.stazioni_tot * 100) as occupancy_stazioni_perc
    FROM lotti l
    LEFT JOIN spazi s ON l.id = s.lotto_id
    LEFT JOIN sponsorship_stazioni st ON l.id = st.lotto_id
    WHERE l.stato IN ('PREVENDITA', 'ATTIVO')
    GROUP BY l.id, l.codice_lotto, l.inventario_spazi, l.stazioni_tot;
    
    CREATE UNIQUE INDEX idx_mv_lotto_kpi_lotto_id ON mv_lotto_kpi(lotto_id);
  `,
  
  // Refresh automatico materialized view
  refreshKPIView: `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lotto_kpi;`,
  
  // Query ottimizzata per dashboard
  getDashboardKPI: `
    SELECT 
      mk.*,
      (mk.ricavo_spazi + mk.ricavo_stazioni) as ricavo_totale,
      l.target_ricavo,
      l.soglia_go_nogo,
      EXTRACT(DAY FROM l.periodo_start - CURRENT_DATE) as giorni_rimanenti
    FROM mv_lotto_kpi mk
    JOIN lotti l ON mk.lotto_id = l.id
    WHERE l.stato = 'PREVENDITA'
    ORDER BY l.periodo_start ASC
    LIMIT 1;
  `
};

// Background job per refresh cache
export class BackgroundJobService {
  
  constructor(private cacheService: CacheService) {
    this.setupCronJobs();
  }
  
  private setupCronJobs() {
    
    // Refresh KPI ogni 15 minuti
    cron.schedule('*/15 * * * *', async () => {
      await this.refreshKPICache();
    });
    
    // Check go/no-go ogni giorno alle 9:00
    cron.schedule('0 9 * * *', async () => {
      await this.checkGoNoGoStatus();
    });
    
    // Cleanup cache ogni notte alle 2:00
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredCache();
    });
  }
  
  private async refreshKPICache(): Promise<void> {
    // Refresh materialized view
    await this.db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lotto_kpi');
    
    // Invalidate dashboard caches
    await this.cacheService.invalidatePattern('dashboard:*');
    
    console.log('KPI cache refreshed');
  }
}
```

---

**Documento Architettura v1.0 - Brellò Sales & Finance Cockpit**  
*Data: 30 Settembre 2025*  
*Preparato da: Bob, Software Architect*