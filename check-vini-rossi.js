
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

async function checkViniRossi() {
  try {
    console.log('🔍 Controllo vini ROSSI nel database...');
    
    // Verifica tutti i vini
    const { data: allWines } = await supabase
      .from('vini')
      .select('nome_vino, tipologia')
      .eq('user_id', user_id);
    
    console.log(`📊 Totale vini: ${allWines?.length || 0}`);
    
    // Raggruppa per tipologia
    const byType = {};
    (allWines || []).forEach(wine => {
      const tipo = wine.tipologia || 'SENZA_TIPOLOGIA';
      byType[tipo] = (byType[tipo] || 0) + 1;
    });
    
    console.log('📋 Vini per tipologia:');
    Object.entries(byType).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count}`);
    });
    
    // Cerca vini che potrebbero essere rossi
    const possibleRed = (allWines || []).filter(wine => {
      const nome = wine.nome_vino?.toLowerCase() || '';
      const tipo = wine.tipologia?.toLowerCase() || '';
      return nome.includes('rosso') || tipo.includes('rosso') || tipo.includes('red');
    });
    
    console.log(`🍷 Vini che potrebbero essere rossi: ${possibleRed.length}`);
    possibleRed.forEach(wine => {
      console.log(`  - ${wine.nome_vino} (${wine.tipologia})`);
    });
    
  } catch (err) {
    console.error('❌ Errore:', err.message);
  }
}

checkViniRossi().catch(console.error);
