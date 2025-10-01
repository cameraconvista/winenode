#!/usr/bin/env node

/**
 * Genera metriche bundle in formato JSON per CI
 */

const fs = require('fs');
const path = require('path');

function generateBundleMetrics() {
  const distPath = path.join(__dirname, '../dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Directory dist non trovata. Esegui npm run build prima.');
    process.exit(1);
  }

  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Directory dist/assets non trovata.');
    process.exit(1);
  }

  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.includes('.map'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  console.log(`📁 Trovati ${files.length} file in dist/assets/`);
  console.log(`📄 JS: ${jsFiles.length}, CSS: ${cssFiles.length}`);
  
  const metrics = {
    timestamp: new Date().toISOString(),
    totalFiles: jsFiles.length + cssFiles.length,
    javascript: {},
    css: {},
    summary: {
      totalJSSize: 0,
      totalCSSSize: 0,
      totalSize: 0
    }
  };

  // Analizza file JS
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    metrics.javascript[file] = {
      size: stats.size,
      sizeKB: sizeKB,
      type: file.includes('chunk') ? 'chunk' : 
            file.includes('vendor') ? 'vendor' : 
            file.includes('index') ? 'main' : 
            file.includes('react-core') ? 'vendor' :
            file.includes('supabase-core') ? 'vendor' :
            file.includes('icons-core') ? 'vendor' : 'other'
    };
    
    metrics.summary.totalJSSize += stats.size;
  });

  // Analizza file CSS
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    metrics.css[file] = {
      size: stats.size,
      sizeKB: sizeKB
    };
    
    metrics.summary.totalCSSSize += stats.size;
  });

  metrics.summary.totalSize = metrics.summary.totalJSSize + metrics.summary.totalCSSSize;
  metrics.summary.totalSizeKB = Math.round(metrics.summary.totalSize / 1024 * 100) / 100;

  // Salva metriche
  const artifactsDir = path.join(__dirname, '../artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const metricsPath = path.join(artifactsDir, 'bundle-metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  console.log('✅ Metriche bundle generate:', metricsPath);
  console.log(`📊 Totale: ${metrics.summary.totalSizeKB} KB (${jsFiles.length} JS + ${cssFiles.length} CSS)`);
  
  return metrics;
}

if (require.main === module) {
  generateBundleMetrics();
}

module.exports = { generateBundleMetrics };
