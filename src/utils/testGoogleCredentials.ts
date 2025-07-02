
export function testGoogleCredentials() {
  const email = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY;
  
  console.log('🔍 VERIFICA CREDENZIALI GOOGLE:');
  console.log('📧 Email configurata:', email ? 'SÌ' : 'NO');
  console.log('🔑 Private Key configurata:', privateKey ? 'SÌ' : 'NO');
  
  if (!email) {
    console.error('❌ VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL non configurata');
  }
  
  if (!privateKey) {
    console.error('❌ VITE_GOOGLE_PRIVATE_KEY non configurata');
  }
  
  if (email && privateKey) {
    console.log('✅ Credenziali Google presenti');
    return true;
  }
  
  return false;
}
