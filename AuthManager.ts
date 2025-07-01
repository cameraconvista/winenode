async signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase non configurato')

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // ✅ CREA IL PROFILO UTENTE DOPO LA REGISTRAZIONE
  const userId = data.user?.id
  if (userId) {
    await supabase.from('profiles').insert({
      id: userId,
      email: email
    })
  }

  return data
}
