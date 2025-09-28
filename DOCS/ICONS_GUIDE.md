# 🎨 Guida Icone - WineNode

**Creato:** 2025-09-28  
**Sistema:** Iconify + unplugin-icons  
**Stack:** React + TypeScript + Vite  

---

## 📦 Collezioni Installate

### Tabler Icons
- **Pacchetto:** `@iconify-json/tabler`
- **Stile:** Outline, stroke-based
- **Totale:** 4000+ icone
- **Uso:** Interfaccia principale, navigazione, azioni

### Lucide Icons  
- **Pacchetto:** `@iconify-json/lucide`
- **Stile:** Outline, minimalista
- **Totale:** 1000+ icone
- **Uso:** Complemento a Tabler, icone specifiche

---

## 🚀 Come Importare un'Icona

### Sintassi Base
```tsx
import IconName from '~icons/collezione/nome-icona'

// Esempi
import TablerHome from '~icons/tabler/home'
import LucideUser from '~icons/lucide/user'
import TablerPlus from '~icons/tabler/plus'
```

### Utilizzo nei Componenti
```tsx
import React from 'react'
import TablerHome from '~icons/tabler/home'
import LucideSettings from '~icons/lucide/settings'

const MyComponent = () => {
  return (
    <div>
      <TablerHome className="icon icon-md icon-primary" />
      <LucideSettings className="icon icon-sm icon-secondary" />
    </div>
  )
}
```

### Con Props SVG
```tsx
import TablerHeart from '~icons/tabler/heart'

<TablerHeart 
  className="icon icon-lg" 
  style={{ color: '#ff0000' }}
  onClick={() => console.log('Clicked!')}
/>
```

---

## 🎨 Standard Visuali

### Dimensioni Standard
- **Extra Small:** `icon-xs` (16×16px)
- **Small:** `icon-sm` (20×20px) 
- **Medium:** `icon-md` (24×24px) - **DEFAULT**
- **Large:** `icon-lg` (32×32px)
- **Extra Large:** `icon-xl` (40×40px)

### Colori Semantici
- **Primary:** `icon-primary` - Testo principale (#541111)
- **Secondary:** `icon-secondary` - Testo secondario (#7a4a30)
- **Accent:** `icon-accent` - Azioni positive (#1a7f37)
- **Danger:** `icon-danger` - Azioni distruttive (#d33b2f)
- **Warning:** `icon-warn` - Avvisi (#d4a300)
- **Muted:** `icon-muted` - Testo disabilitato (#9b9b9b)

### Stroke e Stile
- **Stroke Width:** 2px (standard), 1.5px (piccole)
- **Line Cap:** Round
- **Line Join:** Round
- **Fill:** Usa `currentColor` per ereditare dal parent

---

## 📋 Esempi Pratici

### Pulsanti con Icone
```tsx
import TablerPlus from '~icons/tabler/plus'
import TablerTrash from '~icons/tabler/trash'

<button className="btn btn-primary">
  <TablerPlus className="icon icon-sm" />
  Aggiungi
</button>

<button className="btn btn-danger">
  <TablerTrash className="icon icon-sm" />
  Elimina
</button>
```

### Input con Icone
```tsx
import TablerSearch from '~icons/tabler/search'

<div className="relative">
  <input type="text" className="input pl-10" placeholder="Cerca..." />
  <TablerSearch className="icon icon-sm input-icon input-icon-left" />
</div>
```

### Liste con Icone
```tsx
import TablerFile from '~icons/tabler/file'
import TablerFolder from '~icons/tabler/folder'

<ul>
  <li className="list-item">
    <TablerFolder className="icon icon-sm icon-primary" />
    Cartella Documenti
  </li>
  <li className="list-item">
    <TablerFile className="icon icon-sm icon-secondary" />
    File.pdf
  </li>
</ul>
```

### Navigazione
```tsx
import TablerHome from '~icons/tabler/home'
import TablerSettings from '~icons/tabler/settings'
import TablerUser from '~icons/tabler/user'

<nav>
  <a href="/" className="nav-item">
    <TablerHome className="icon icon-md" />
    Home
  </a>
  <a href="/settings" className="nav-item">
    <TablerSettings className="icon icon-md" />
    Impostazioni
  </a>
</nav>
```

---

## 🔧 Classi CSS Disponibili

### Dimensioni
```css
.icon-xs    /* 16×16px */
.icon-sm    /* 20×20px */
.icon-md    /* 24×24px - default */
.icon-lg    /* 32×32px */
.icon-xl    /* 40×40px */
```

### Colori
```css
.icon-primary    /* Colore testo principale */
.icon-secondary  /* Colore testo secondario */
.icon-accent     /* Colore accent/successo */
.icon-danger     /* Colore errore/pericolo */
.icon-warn       /* Colore avviso */
.icon-muted      /* Colore disabilitato */
```

### Stati
```css
.icon-interactive  /* Cursore pointer + hover effects */
.icon-loading      /* Animazione rotazione */
.icon-responsive   /* Ridimensiona su mobile */
```

### Posizionamento
```css
.input-icon        /* Posizione assoluta per input */
.input-icon-left   /* Icona a sinistra nell'input */
.input-icon-right  /* Icona a destra nell'input */
```

---

## 🌐 Ricerca Icone

### Siti Utili
- **Tabler Icons:** https://tabler-icons.io/
- **Lucide Icons:** https://lucide.dev/icons/
- **Iconify:** https://icon-sets.iconify.design/

### Convenzioni Naming
- **Tabler:** `tabler/nome-icona` (es. `tabler/home`, `tabler/user-plus`)
- **Lucide:** `lucide/nome-icona` (es. `lucide/home`, `lucide/user-plus`)

### Ricerca per Categoria
- **Navigazione:** home, arrow-left, arrow-right, menu
- **Azioni:** plus, minus, edit, trash, save
- **Stato:** check, x, alert-circle, info-circle
- **Media:** play, pause, volume, image
- **Comunicazione:** mail, phone, message, send

---

## ➕ Aggiungere Nuove Collezioni

### 1. Installazione
```bash
npm install --save-dev @iconify-json/nome-collezione
```

### 2. Esempi Collezioni Popolari
```bash
# Material Design Icons
npm install --save-dev @iconify-json/mdi

# Heroicons
npm install --save-dev @iconify-json/heroicons

# Feather Icons  
npm install --save-dev @iconify-json/feather

# Font Awesome
npm install --save-dev @iconify-json/fa6-solid
```

### 3. Utilizzo
```tsx
import MdiHeart from '~icons/mdi/heart'
import HeroHome from '~icons/heroicons/home'
import FeatherStar from '~icons/feather/star'
```

### 4. Configurazione Automatica
Il plugin `unplugin-icons` ha `autoInstall: true`, quindi le collezioni vengono installate automaticamente al primo utilizzo.

---

## 🎯 Best Practices

### Consistenza Visuale
- Usa **una collezione principale** (Tabler) per la maggior parte delle icone
- Usa **Lucide come complemento** per icone specifiche non disponibili
- Mantieni **dimensioni coerenti** nel stesso contesto (es. tutti i pulsanti con `icon-sm`)

### Performance
- Le icone vengono **tree-shaked** automaticamente
- Solo le icone effettivamente utilizzate finiscono nel bundle
- Nessun impatto sulle performance di caricamento

### Accessibilità
- Usa `aria-hidden="true"` per icone decorative
- Aggiungi `aria-label` per icone interattive senza testo
- Mantieni contrasto sufficiente con lo sfondo

### Esempi Accessibilità
```tsx
// Icona decorativa
<TablerStar className="icon" aria-hidden="true" />

// Icona interattiva
<button aria-label="Chiudi finestra">
  <TablerX className="icon" />
</button>

// Icona con testo
<button>
  <TablerPlus className="icon" aria-hidden="true" />
  Aggiungi elemento
</button>
```

---

## 🔄 Migrazione Graduale

### Strategia Consigliata
1. **Non sostituire** icone esistenti immediatamente
2. **Usa il nuovo sistema** solo per nuove funzionalità
3. **Migra gradualmente** le icone più utilizzate
4. **Mantieni consistenza** durante la transizione

### Identificazione Icone Esistenti
```bash
# Cerca icone hardcoded nel codice
grep -r "svg\|icon" src/ --include="*.tsx" --include="*.ts"

# Cerca classi CSS di icone
grep -r "fa-\|material-icons" src/ --include="*.tsx" --include="*.css"
```

---

## 🐛 Troubleshooting

### Errore: "Cannot resolve ~icons/..."
**Causa:** Plugin non configurato correttamente  
**Soluzione:** Verifica `vite.config.ts` e riavvia dev server

### Errore TypeScript
**Causa:** Dichiarazioni di tipo mancanti  
**Soluzione:** Verifica `src/vite-env.d.ts` contenga le dichiarazioni per `~icons/*`

### Icona non trovata
**Causa:** Nome icona errato o collezione non installata  
**Soluzione:** Verifica nome su sito ufficiale della collezione

### Stili non applicati
**Causa:** CSS non importato  
**Soluzione:** Verifica import in `src/index.css`

---

## 📊 Configurazione Attuale

### File Modificati
- `vite.config.ts` - Plugin unplugin-icons
- `src/vite-env.d.ts` - Dichiarazioni TypeScript
- `src/index.css` - Import stili icone
- `src/styles/components/icons.css` - Stili base

### Pacchetti Installati
```json
{
  "devDependencies": {
    "unplugin-icons": "^0.x.x",
    "@iconify-json/tabler": "^1.x.x", 
    "@iconify-json/lucide": "^1.x.x"
  }
}
```

### Configurazione Plugin
```ts
Icons({
  compiler: 'jsx',
  jsx: 'react',
  defaultStyle: 'display: inline-block;',
  defaultClass: 'icon',
  scale: 1,
  autoInstall: true
})
```

---

## 🎉 Pronto all'Uso

Il sistema è ora configurato e pronto per l'utilizzo. Puoi iniziare a importare e utilizzare icone da Tabler e Lucide seguendo gli esempi in questa guida.

**Prossimi passi:**
1. Testa l'importazione di un'icona in un componente esistente
2. Verifica che gli stili vengano applicati correttamente  
3. Pianifica la migrazione graduale delle icone esistenti
4. Aggiungi nuove collezioni se necessario

Per domande o problemi, consulta la sezione Troubleshooting o la documentazione ufficiale di unplugin-icons.
