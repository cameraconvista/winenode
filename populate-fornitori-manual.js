
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtmohyjquscdkbtibdsu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populateFornitori() {
  try {
    console.log('🔄 Avvio popolamento tabella fornitori...');

    // 1. Verifica se la tabella fornitori esiste
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'fornitori');

    if (tablesError || !tables || tables.length === 0) {
      console.log('⚠️ Tabella fornitori non trovata, creazione...');
      
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS fornitori (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nome text NOT NULL,
            user_id uuid NOT NULL REFERENCES auth.users(id),
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(nome, user_id)
          );
          
          CREATE INDEX IF NOT EXISTS idx_fornitori_user_id ON fornitori(user_id);
          CREATE INDEX IF NOT EXISTS idx_fornitori_nome ON fornitori(nome);
          
          -- Abilita RLS
          ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
          
          -- Policy per gli utenti autenticati
          CREATE POLICY "Users can view own suppliers" ON fornitori
            FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert own suppliers" ON fornitori
            FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update own suppliers" ON fornitori
            FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete own suppliers" ON fornitori
            FOR DELETE USING (auth.uid() = user_id);
        `
      });

      if (createError) {
        console.error('❌ Errore creazione tabella:', createError);
        return;
      }
      
      console.log('✅ Tabella fornitori creata');
    }

    // 2. Recupera tutti gli utenti con vini
    const { data: users, error: usersError } = await supabase
      .from('giacenze')
      .select('user_id')
      .not('supplier', 'is', null)
      .not('supplier', 'eq', '');

    if (usersError) {
      console.error('❌ Errore recupero utenti:', usersError);
      return;
    }

    const uniqueUsers = Array.from(new Set(users?.map(u => u.user_id) || []));
    console.log(`👥 Trovati ${uniqueUsers.length} utenti con vini`);

    // 3. Per ogni utente, estrai e inserisci i fornitori
    for (const userId of uniqueUsers) {
      console.log(`🔄 Elaborazione utente: ${userId}`);

      // Estrai fornitori unici dai vini dell'utente
      const { data: wines, error: winesError } = await supabase
        .from('giacenze')
        .select('supplier')
        .eq('user_id', userId)
        .not('supplier', 'is', null)
        .not('supplier', 'eq', '');

      if (winesError) {
        console.error(`❌ Errore recupero vini per utente ${userId}:`, winesError);
        continue;
      }

      const suppliers = wines?.map(w => w.supplier?.trim()).filter(Boolean) || [];
      const uniqueSuppliers = Array.from(new Set(suppliers));

      if (uniqueSuppliers.length === 0) {
        console.log(`⚠️ Nessun fornitore per utente ${userId}`);
        continue;
      }

      console.log(`📦 Trovati ${uniqueSuppliers.length} fornitori per utente ${userId}:`, uniqueSuppliers);

      // Prepara i dati per l'inserimento
      const fornitoriData = uniqueSuppliers.map(nome => ({
        nome: nome.toUpperCase(),
        user_id: userId
      }));

      // Inserisci i fornitori (ignora duplicati)
      const { data: inserted, error: insertError } = await supabase
        .from('fornitori')
        .upsert(fornitoriData, { 
          onConflict: 'nome,user_id',
          ignoreDuplicates: true 
        })
        .select();

      if (insertError) {
        console.error(`❌ Errore inserimento fornitori per utente ${userId}:`, insertError);
      } else {
        console.log(`✅ Inseriti ${inserted?.length || 0} fornitori per utente ${userId}`);
      }
    }

    // 4. Verifica finale
    const { data: finalCount, error: countError } = await supabase
      .from('fornitori')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`🎉 Popolamento completato! Totale fornitori: ${finalCount?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

// Esegui lo script
populateFornitori().then(() => {
  console.log('🏁 Script terminato');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script fallito:', error);
  process.exit(1);
});
