
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const TIPOLOGIE = [
  'ROSSI',
  'BIANCHI', 
  'ROSATI',
  'BOLLICINE ITALIANE',
  'BOLLICINE FRANCESI',
  'VINI DOLCI'
];

async function popolaTipologie() {
  try {
    console.log('🏷️ Tipologie presenti nel database:');
    
    // Prima verifica se esistono già tipologie
    const { data: existing } = await supabase
      .from('tipologie')
      .select('nome')
      .eq('user_id', user_id);
    
    console.log('Tipologie esistenti:', existing?.map(t => t.nome) || []);
    
    // Elimina tipologie esistenti per questo utente
    const { error: deleteError } = await supabase
      .from('tipologie')
      .delete()
      .eq('user_id', user_id);
    
    if (deleteError) {
      console.error('Errore eliminazione tipologie esistenti:', deleteError);
    }
    
    console.log('🔧 Popolazione tabella tipologie...');
    
    // Inserisci le nuove tipologie
    for (const tipologia of TIPOLOGIE) {
      try {
        const { error } = await supabase
          .from('tipologie')
          .insert({
            nome: tipologia,
            colore: getTipologiaColor(tipologia),
            user_id: user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error(`❌ Errore inserimento ${tipologia}:`, error.message);
        } else {
          console.log(`✅ Inserita tipologia: ${tipologia}`);
        }
      } catch (err) {
        console.error(`❌ Errore inserimento ${tipologia}:`, err.message);
      }
    }
    
    console.log('🏁 Popolazione tipologie completata');
    
    // Verifica finale
    const { data: finalCheck } = await supabase
      .from('tipologie')
      .select('nome')
      .eq('user_id', user_id);
    
    console.log('🔍 Tipologie finali:', finalCheck?.map(t => t.nome) || []);
    
  } catch (err) {
    console.error('❌ Errore generale:', err.message);
  }
}

function getTipologiaColor(tipologia) {
  switch (tipologia) {
    case 'ROSSI': return '#8B0000';
    case 'BIANCHI': return '#F5F5DC';
    case 'ROSATI': return '#FFC0CB';
    case 'BOLLICINE ITALIANE': return '#FFD700';
    case 'BOLLICINE FRANCESI': return '#9ACD32';
    case 'VINI DOLCI': return '#DDA0DD';
    default: return '#808080';
  }
}

popolaTipologie().catch(console.error);
