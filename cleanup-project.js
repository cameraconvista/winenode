
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🧹 Avvio pulizia automatica progetto WineNode...')

// 1. Rimuovi file temporanei
const tempDirs = ['node_modules', '.vite', 'dist', '.next']
tempDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`🗑️ Rimozione ${dir}...`)
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// 2. Rimuovi file lock
const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']
lockFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`🗑️ Rimozione ${file}...`)
    fs.unlinkSync(file)
  }
})

// 3. Verifica package.json
const packageJsonPath = 'package.json'
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  // Rimuovi @supabase/postgrest-js se presente
  if (packageJson.dependencies && packageJson.dependencies['@supabase/postgrest-js']) {
    delete packageJson.dependencies['@supabase/postgrest-js']
    console.log('✅ Rimosso @supabase/postgrest-js da package.json')
  }
  
  if (packageJson.devDependencies && packageJson.devDependencies['@supabase/postgrest-js']) {
    delete packageJson.devDependencies['@supabase/postgrest-js']
    console.log('✅ Rimosso @supabase/postgrest-js da devDependencies')
  }
  
  // Assicurati che @supabase/supabase-js sia presente
  if (!packageJson.dependencies['@supabase/supabase-js']) {
    packageJson.dependencies['@supabase/supabase-js'] = '^2.50.0'
    console.log('✅ Aggiunto @supabase/supabase-js')
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

console.log('✅ Pulizia completata! Ora esegui: npm install')
