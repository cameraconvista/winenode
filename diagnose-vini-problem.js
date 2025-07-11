
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtmohyjquscdkbtibdsu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk';
const USER_ID = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnoseViniProblem() {
  console.log('🔍 DIAGNOSI PROBLEMA VINI...\n');
  
  try {
    // 1. Conta tutti i vini dell'utente
    const { data: allVini, error: allError } = await supabase
      .from('vini')
      .select('*')
      .eq('user_id', USER_ID);
    
    if (allError) {
      console.error('❌ Errore caricamento vini:', allError);
      return;
    }
    
    console.log(`📊 TOTALE VINI IN DATABASE: ${allVini.length}`);
    
    // 2. Raggruppa per tipologia
    const byTipologia = {};
    allVini.forEach(vino => {
      const tipo = vino.tipologia || 'SENZA_TIPOLOGIA';
      byTipologia[tipo] = (byTipologia[tipo] || 0) + 1;
    });
    
    console.log('\n📋 VINI PER TIPOLOGIA:');
    Object.entries(byTipologia).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count} vini`);
    });
    
    // 3. Verifica giacenze
    const { data: giacenze, error: giacenzeError } = await supabase
      .from('giacenza')
      .select('*')
      .eq('user_id', USER_ID);
    
    if (giacenzeError) {
      console.error('❌ Errore caricamento giacenze:', giacenzeError);
    } else {
      console.log(`\n📦 TOTALE GIACENZE: ${giacenze.length}`);
    }
    
    // 4. Vini senza giacenza
    const viniSenzaGiacenza = allVini.filter(vino => 
      !giacenze.some(g => g.vino_id === vino.id)
    );
    
    console.log(`\n⚠️ VINI SENZA GIACENZA: ${viniSenzaGiacenza.length}`);
    if (viniSenzaGiacenza.length > 0) {
      console.log('Primi 5 vini senza giacenza:');
      viniSenzaGiacenza.slice(0, 5).forEach(vino => {
        console.log(`  - ${vino.nome_vino} (${vino.tipologia})`);
      });
    }
    
    // 5. Test query come nell'app
    const { data: testVini, error: testError } = await supabase
      .from('vini')
      .select('*')
      .eq('user_id', USER_ID)
      .order('nome_vino', { ascending: true });
    
    if (testError) {
      console.error('❌ Errore query test:', testError);
    } else {
      console.log(`\n🧪 TEST QUERY ORDINATA: ${testVini.length} vini`);
    }
    
    // 6. Mostra primi 10 vini per debug
    console.log('\n🔍 PRIMI 10 VINI NEL DATABASE:');
    allVini.slice(0, 10).forEach((vino, i) => {
      console.log(`${i+1}. ${vino.nome_vino} - ${vino.tipologia} - ${vino.fornitore}`);
    });
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

diagnoseViniProblem();
