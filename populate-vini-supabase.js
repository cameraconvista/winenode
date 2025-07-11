
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtmohyjquscdkbtibdsu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk';
const USER_ID = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const winesData = [
  {
    nome_vino: "AMARONE DELLA VALPOLICELLA CLASSICO",
    anno: 2020,
    produttore: "Cantina Valpolicella",
    provenienza: "Veneto",
    fornitore: "BOLOGNA VINI",
    costo: 45.00,
    vendita: 75.00,
    margine: 30.00,
    tipologia: "ROSSI",
    user_id: USER_ID
  },
  {
    nome_vino: "BAROLO DOCG BRUNATE",
    anno: 2019,
    produttore: "Azienda Vinicola Piemontese",
    provenienza: "Piemonte",
    fornitore: "BOLOGNA VINI",
    costo: 55.00,
    vendita: 95.00,
    margine: 40.00,
    tipologia: "ROSSI",
    user_id: USER_ID
  },
  {
    nome_vino: "CHIANTI CLASSICO RISERVA",
    anno: 2021,
    produttore: "Tenuta Toscana",
    provenienza: "Toscana",
    fornitore: "ITALIA VINI",
    costo: 25.00,
    vendita: 45.00,
    margine: 20.00,
    tipologia: "ROSSI",
    user_id: USER_ID
  },
  {
    nome_vino: "SOAVE DOC CLASSICO",
    anno: 2023,
    produttore: "Cantina del Soave",
    provenienza: "Veneto",
    fornitore: "BOLOGNA VINI",
    costo: 12.00,
    vendita: 22.00,
    margine: 10.00,
    tipologia: "BIANCHI",
    user_id: USER_ID
  },
  {
    nome_vino: "VERMENTINO DI SARDEGNA",
    anno: 2023,
    produttore: "Cantina Sarda",
    provenienza: "Sardegna",
    fornitore: "ITALIA VINI",
    costo: 15.00,
    vendita: 28.00,
    margine: 13.00,
    tipologia: "BIANCHI",
    user_id: USER_ID
  },
  {
    nome_vino: "PROSECCO DI VALDOBBIADENE DOCG",
    anno: 2023,
    produttore: "Cantina Valdobbiadene",
    provenienza: "Veneto",
    fornitore: "BOLOGNA VINI",
    costo: 8.00,
    vendita: 18.00,
    margine: 10.00,
    tipologia: "BOLLICINE ITALIANE",
    user_id: USER_ID
  },
  {
    nome_vino: "FRANCIACORTA DOCG BRUT",
    anno: 2022,
    produttore: "Cantina Franciacorta",
    provenienza: "Lombardia",
    fornitore: "ITALIA VINI",
    costo: 18.00,
    vendita: 35.00,
    margine: 17.00,
    tipologia: "BOLLICINE ITALIANE",
    user_id: USER_ID
  },
  {
    nome_vino: "CERASUOLO D'ABRUZZO",
    anno: 2023,
    produttore: "Cantina Abruzzese",
    provenienza: "Abruzzo",
    fornitore: "BOLOGNA VINI",
    costo: 10.00,
    vendita: 20.00,
    margine: 10.00,
    tipologia: "ROSATI",
    user_id: USER_ID
  }
];

async function populateViniTable() {
  console.log('🚀 Inizio popolamento tabella vini...');
  
  try {
    // Prima pulisci la tabella
    console.log('🗑️ Rimozione vini esistenti...');
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('user_id', USER_ID);
    
    if (deleteError) {
      console.error('❌ Errore cancellazione:', deleteError);
      return;
    }
    
    console.log('✅ Vini esistenti rimossi');
    
    // Inserisci i nuovi vini
    console.log('📊 Inserimento vini...');
    const { data, error } = await supabase
      .from('vini')
      .insert(winesData)
      .select();
    
    if (error) {
      console.error('❌ Errore inserimento:', error);
      return;
    }
    
    console.log(`✅ ${data.length} vini inseriti con successo!`);
    
    // Verifica il risultato
    const { data: countData, error: countError } = await supabase
      .from('vini')
      .select('*', { count: 'exact' })
      .eq('user_id', USER_ID);
    
    if (countError) {
      console.error('❌ Errore verifica:', countError);
      return;
    }
    
    console.log(`🔍 Verifica: ${countData.length} vini nella tabella`);
    console.log('🎉 Popolamento completato!');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

populateViniTable();
