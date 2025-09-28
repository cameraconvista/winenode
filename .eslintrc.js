module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Complessità delle funzioni
    'complexity': ['warn', 30],
    'max-lines-per-function': ['warn', 400],
    // Evita console.log in produzione
    'no-console': 'off',
    // Variabili non utilizzate
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    // Permetti any quando necessario
    '@typescript-eslint/no-explicit-any': 'warn',
    // Guardrail anti-regressione dipendenze pesanti
    'no-restricted-imports': [
      'error',
      {
        'patterns': [
          {
            'group': ['lodash'],
            'message': 'Import lodash per-funzione o usa lodash-es per tree-shaking. Esempio: import { debounce } from "lodash-es"'
          },
          {
            'group': ['moment'],
            'message': 'Usa dayjs invece di moment per bundle size migliore. Esempio: import dayjs from "dayjs"'
          }
        ],
        'paths': [
          {
            'name': 'lodash',
            'message': 'Import lodash per-funzione o usa lodash-es. Esempio: import { debounce } from "lodash-es"'
          }
        ]
      }
    ]
  },
}
