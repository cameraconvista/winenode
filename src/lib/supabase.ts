import { createClient, type User, type Session } from '@supabase/supabase-js'

// ✅ Verifica che le variabili d'ambiente siano presenti
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient: any = null
let isSupabaseAvailable = false

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
    isSupabaseAvailable = true
    console.log('✅ Supabase client creato con successo')
  } catch (error) {
    console.error('❌ Errore creazione client Supabase:', error)
    isSupabaseAvailable = false
  }
} else {
  console.warn('⚠️ Variabili Supabase mancanti - modalità fallback')
  isSupabaseAvailable = false
}

// Fallback mock per sviluppo locale
const mockSupabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    signUp: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
    refreshSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => () => {}
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: () => Promise.resolve({ data: [], error: null }),
    order: () => Promise.resolve({ data: [], error: null }),
    limit: () => Promise.resolve({ data: [], error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null })
  })
}

export { isSupabaseAvailable }
export const supabase = supabaseClient || mockSupabase

// authManagerSimple rimosso - usa authManager

export type AuthUser = User | null
export type AuthSession = Session | null

export class AuthManager {
  private static instance: AuthManager
  private currentUser: AuthUser = null
  private currentSession: AuthSession = null
  private listeners: ((user: AuthUser) => void)[] = []

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) AuthManager.instance = new AuthManager()
    return AuthManager.instance
  }

  private async initializeAuth() {
    if (!supabaseClient) return

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()

      if (error) {
        console.warn('⚠️ Errore nel recupero sessione:', error.message)
        this.currentSession = null
        this.currentUser = null
      } else {
        this.currentSession = session
        this.currentUser = session?.user || null
        if (session) {
          console.log('✅ Sessione esistente trovata:', session.user?.email)
        }
      }

      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state change:', event)
        this.currentSession = session
        this.currentUser = session?.user || null
        this.notifyListeners()
      })

      this.notifyListeners()
    } catch (error) {
      console.error('❌ Errore inizializzazione auth:', error)
      this.currentSession = null
      this.currentUser = null
      this.notifyListeners()
    }
  }

  getCurrentUser(): AuthUser {
    return this.currentUser
  }

  getCurrentSession(): AuthSession {
    return this.currentSession
  }

  isAuthenticated(): boolean {
    return !!this.currentUser
  }

  getUserId(): string | null {
    return this.currentUser?.id || null
  }

  async validateSession(): Promise<boolean> {
    if (!supabaseClient) return false

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()

      if (error || !session) {
        this.currentSession = null
        this.currentUser = null
        return false
      }

      this.currentSession = session
      this.currentUser = session?.user || null
      return true
    } catch (error) {
      console.error('❌ Errore validazione sessione:', error)
      return false
    }
  }

  onAuthStateChange(callback: (user: AuthUser) => void) {
    this.listeners.push(callback)
    callback(this.currentUser)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  async signIn(email: string, password: string) {
    if (!supabaseClient) throw new Error('Supabase non configurato')

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async signOut() {
    if (!supabaseClient) throw new Error('Supabase non configurato')

    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
  }

  async signUp(email: string, password: string) {
    if (!supabaseClient) throw new Error('Supabase non configurato')

    const { data, error } = await supabaseClient.auth.signUp({ email, password })
    if (error) throw error
    return data
  }
}

// Esporta l'istanza singleton di AuthManager
export const authManager = AuthManager.getInstance()