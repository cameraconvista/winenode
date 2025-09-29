import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  // Browser environment (React/TS)
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        console: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        CustomEvent: 'readonly',
        HTMLTextAreaElement: 'readonly',
        React: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this better
      // Governance architetturale (relaxed)
      'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'complexity': ['warn', 20],
      'max-depth': ['warn', 6],
      'max-params': ['warn', 8],
      'max-nested-callbacks': ['warn', 5],
      // Guardrail v1.0.0 - Restricted imports
      'no-restricted-imports': ['error', {
        'patterns': [{
          'group': ['lodash'],
          'message': 'Use lodash-es or specific function imports instead of default lodash import'
        }, {
          'group': ['moment'],
          'message': 'Use dayjs instead of moment for better performance and smaller bundle'
        }]
      }]
    }
  },
  // Pages/Components complessi - governance rilassata
  {
    files: ['src/pages/**/*.tsx', 'src/components/**/*Modal*.tsx', 'src/components/**/orders/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      // Governance rilassata per componenti complessi
      'max-lines': ['warn', { max: 1200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'complexity': ['warn', 30],
      'max-depth': ['warn', 8],
      'max-params': ['warn', 10],
      'max-nested-callbacks': ['warn', 6]
    }
  },
  // Node environment (scripts and server)
  {
    files: ['scripts/**/*.{js,ts}', 'server/**/*.{js,ts}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off'
    }
  },
  {
    ignores: [
      'dist/**', 
      'node_modules/**', 
      '.recovery/**', 
      'Backup_Automatico/**',
      'ARCHIVE/**',
      '**/*.config.*',
      '.eslintrc.js',
      'scripts/recovery-system.cjs',
      'shared/**'
    ]
  }
];
