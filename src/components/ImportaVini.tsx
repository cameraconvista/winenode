import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  X,
  Upload,
  Download,
  ChevronRight,
  Settings,
  Edit,
  Trash2
} from "lucide-react";
import { authManager, supabase, isSupabaseAvailable } from '../lib/supabase'

interface ImportaViniProps {}

export default function ImportaVini({}: ImportaViniProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const [textInput, setTextInput] = useState('')
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)

  // Google Sheet states
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [currentSheetLink, setCurrentSheetLink] = useState<string | null>(null)
  const [isLoadingSheet, setIsLoadingSheet] = useState(false)
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [sheetMessage, setSheetMessage] = useState('')

  // Auto-sync state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)

  // Load current Google Sheet link and start auto-sync
  useEffect(() => {
    const loadCurrentSheetLink = async () => {
      const userId = authManager.getUserId()
      if (!userId || !isSupabaseAvailable) return

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('google_sheet_url')
          .eq('user_id', userId)
          .single()

        if (!error && data?.google_sheet_url) {
          setCurrentSheetLink(data.google_sheet_url)

          // Avvia sincronizzazione automatica
          const { startAutoSync } = await import('../lib/importFromGoogleSheet')
          startAutoSync(data.google_sheet_url, userId)
          setAutoSyncEnabled(true)
          console.log('🔄 Sincronizzazione automatica attivata')
        }
      } catch (error) {
        console.error('Error loading sheet link:', error)
      }
    }

    loadCurrentSheetLink()

    // Cleanup al dismount
    return () => {
      import('../lib/importFromGoogleSheet').then(({ stopAutoSync }) => {
        stopAutoSync()
      })
    }
  }, [])

  // Listener per aggiornamenti automatici
  useEffect(() => {
    const handleWinesUpdated = (event: CustomEvent) => {
      setSheetStatus('success')
      setSheetMessage(`🔄 ${event.detail.message}`)

      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => {
        setSheetStatus('idle')
        setSheetMessage('')
      }, 3000)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('winesUpdated', handleWinesUpdated as EventListener)
      return () => {
        window.removeEventListener('winesUpdated', handleWinesUpdated as EventListener)
      }
    }
  }, [])

  const saveWineToSupabase = async (name: string, type: string, userId: string) => {
    if (!isSupabaseAvailable || !supabase) {
      throw new Error('Supabase non disponibile')
    }

    // Prima inserisci il vino nella tabella vini
    const { data: wineData, error: wineError } = await supabase
      .from('vini')
      .insert({
        nome_vino: name.trim(),
        tipologia: type.toLowerCase().trim(),
        fornitore: '-',
        min_stock: 0,
        vendita: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (wineError) {
      console.error('Errore inserimento vino:', wineError);
      throw wineError;
    }

    // Poi inserisci la giacenza nella tabella giacenza
    const { data, error } = await supabase
      .from('giacenza')
      .insert({
        vino_id: wineData.id,
        giacenza: 0,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Errore Supabase:', error)
      throw error
    }

    return data
  }

  const handleImportFromGoogleSheet = async () => {
    // Verifica diretta delle credenziali Google Sheets
    const hasCredentials = !!(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY && import.meta.env.VITE_GOOGLE_SHEET_ID);
    if (!hasCredentials) {
      setSheetStatus('error')
      setSheetMessage('❌ Credenziali Google Sheets non configurate nelle Secrets')
      return
    }

    const userId = authManager.getUserId()
    if (!userId) {
      setSheetStatus('error')
      setSheetMessage('Utente non autenticato')
      return
    }

    if (!googleSheetUrl.trim()) {
      setSheetStatus('error')
      setSheetMessage('Inserisci un link al Google Sheet')
      return
    }

    setIsLoadingSheet(true)
    setSheetStatus('idle')

    try {
      // Importa usando il sistema Google Sheets API ripristinato
      const { importFromGoogleSheet } = await import('../lib/importFromGoogleSheet')
      const result = await importFromGoogleSheet(googleSheetUrl, userId)

      if (result.success) {
        setSheetStatus('success')
        setSheetMessage(result.message)

        // Salva il link per uso futuro
        await saveSheetLink()

        // Avvia sincronizzazione automatica se non già attiva
        if (!autoSyncEnabled) {
          const { startAutoSync } = await import('../lib/importFromGoogleSheet')
          startAutoSync(googleSheetUrl, userId)
          setAutoSyncEnabled(true)
          console.log('🔄 Sincronizzazione automatica attivata')
        }

        // Aggiorna la lista dei vini
        if (typeof onImportComplete === 'function') {
          onImportComplete()
        }
      } else {
        setSheetStatus('error')
        setSheetMessage(result.message)

        if (result.errors && result.errors.length > 0) {
          console.error('Errori importazione:', result.errors)
        }
      }
    } catch (error) {
      console.error('Errore importazione Google Sheet:', error)
      setSheetStatus('error')
      setSheetMessage(`❌ Errore durante l'importazione: ${error.message}`)
    } finally {
      setIsLoadingSheet(false)
    }
  }

  const handleManualSync = async () => {
    const userId = authManager.getUserId()
    if (!userId) {
      setSheetStatus('error')
      setSheetMessage('Utente non autenticato')
      return
    }

    if (!currentSheetLink) {
      setSheetStatus('error')
      setSheetMessage('Nessun Google Sheet collegato')
      return
    }

    setIsLoadingSheet(true)
    setSheetStatus('idle')

    try {
      const { importFromGoogleSheet } = await import('../lib/importFromGoogleSheet')
      const result = await importFromGoogleSheet(currentSheetLink, userId)

      if (result.success) {
        setSheetStatus('success')
        setSheetMessage(result.message)
      } else {
        setSheetStatus('error')
        setSheetMessage(result.message)

        if (result.errors && result.errors.length > 0) {
          console.error('Errori importazione:', result.errors)
        }
      }
    } catch (error) {
      console.error('Errore importazione Google Sheet:', error)
      setSheetStatus('error')
      setSheetMessage(`❌ Errore durante l'importazione: ${error.message}`)
    } finally {
      setIsLoadingSheet(false)
    }
  }


  const processImportData = async (data: string, source: string) => {
    const userId = authManager.getUserId()
    if (!userId) {
      setImportStatus('error')
      setImportMessage('Utente non autenticato')
      return
    }

    if (!isSupabaseAvailable) {
      setImportStatus('error')
      setImportMessage('Supabase non configurato')
      return
    }

    setIsImporting(true)
    setImportStatus('idle')

    try {
      const lines = data.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        throw new Error('Nessun dato da importare')
      }

      let importedCount = 0
      const errors: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          let name = ''
          let type = ''

          // Check if it's CSV format (contains comma)
          if (line.includes(',')) {
            const columns = line.split(',').map(col => col.replace(/"/g, '').trim())
            if (columns.length >= 2) {
              name = columns[0]
              type = columns[1].toLowerCase()
            } else {
              errors.push(`Riga ${i + 1}: Formato CSV non valido - deve contenere almeno nome,tipo`)
              continue
            }
          } else {
            // Space-separated format
            const spaceIndex = line.indexOf(' ')
            if (spaceIndex === -1) {
              errors.push(`Riga ${i + 1}: Formato non valido - deve contenere nome e tipo separati da spazio`)
              continue
            }

            name = line.substring(0, spaceIndex).trim()
            type = line.substring(spaceIndex + 1).trim().toLowerCase()
          }

          if (!name || !type) {
            errors.push(`Riga ${i + 1}: Nome o tipo mancante`)
            continue
          }

          if (!['rosso', 'bianco', 'bollicine', 'rosato'].includes(type)) {
            errors.push(`Riga ${i + 1}: Tipo non valido - deve essere rosso, bianco, bollicine o rosato`)
            continue
          }

          // Save to Supabase
          await saveWineToSupabase(name, type, userId)
          importedCount++

        } catch (error) {
          console.error(`Errore riga ${i + 1}:`, error)
          errors.push(`Riga ${i + 1}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
        }
      }

      setImportStatus('success')
      let message = `${source} importato con successo - ${importedCount} vini elaborati`
      if (errors.length > 0) {
        message += ` (${errors.length} errori)`
      }
      setImportMessage(message)
    } catch (error) {
      console.error('Errore durante l\'importazione:', error)
      setImportStatus('error')
      setImportMessage(`Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await processImportData(text, `File "${file.name}"`)
    } catch (error) {
      console.error('Errore nella lettura del file:', error)
      setImportStatus('error')
      setImportMessage('Errore nella lettura del file')
      setIsImporting(false)
    }
  }

  const handleTextImport = async () => {
    if (!textInput.trim()) {
      setImportStatus('error')
      setImportMessage('Inserisci almeno una riga di testo')
      return
    }

    await processImportData(textInput, 'Testo incollato')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Messages */}
      {(importStatus !== 'idle' || sheetStatus !== 'idle') && (
        <div className="space-y-3">
          {importStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              importStatus === 'success' 
                ? 'bg-green-900/20 border border-green-800' 
                : 'bg-red-900/20 border border-red-800'
            }`}>
              {importStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm ${
                importStatus === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {importMessage}
              </p>
            </div>
          )}

          {sheetStatus !== 'idle' && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              sheetStatus === 'success' 
                ? 'bg-green-900/20 border border-green-800' 
                : 'bg-red-900/20 border border-red-800'
            }`}>
              {sheetStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm ${
                sheetStatus === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {sheetMessage}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal File Upload */}
      {showFileUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-bold text-cream uppercase">
                  CARICA FILE
                </h3>
              </div>

              {/* File Selection Buttons */}
              <div className="space-y-3 mb-6">
                <p className="text-gray-400 text-sm text-center">
                  Importazione diretta da file locale
                </p>
              </div>

              {/* File Drop Area */}
              <div className="text-center py-12 mb-6">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="modal-file-upload"
                  disabled={isImporting}
                />
                <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-cream font-medium mb-2 text-lg">
                  Seleziona file
                </p>
                <p className="text-gray-400 text-sm">
                  CSV, TXT, Excel (max 10MB)
                </p>
              </div>

              {/* Format Info */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm text-gray-400">
                  <p><span className="font-medium text-cream">Formato:</span> Nome Tipo (per riga)</p>
                  <p>Solo nome e tipo vino necessari</p>
                </div>
              </div>

              {/* Status message */}
              {importStatus !== 'idle' && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  importStatus === 'success' 
                    ? 'bg-green-900/20 border border-green-800' 
                    : 'bg-red-900/20 border border-red-800'
                }`}>
                  {importStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <p className={`text-sm ${
                    importStatus === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {importMessage}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFileUploadModal(false);
                    setImportStatus('idle');
                    setImportMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={isImporting}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {currentSheetLink && (
                <div className="text-sm text-green-400 mb-2 flex items-center justify-between">
                  <span>✅ Google Sheet collegato</span>
                  <button
                    onClick={handleManualSync}
                    disabled={isLoadingSheet}
                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-2 py-1 rounded"
                  >
                    {isLoadingSheet ? '🔄' : 'Sincronizza Ora'}
                  </button>
                </div>
              )}
    </div>
  )
}