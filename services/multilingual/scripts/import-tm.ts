#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { TranslationEntry } from '../src/types';
import { parse } from 'csv-parse/sync';

interface ImportOptions {
  format: 'json' | 'csv';
  input: string;
  kvNamespace: string;
  accountId: string;
  apiToken: string;
  overwrite: boolean;
}

async function uploadToKV(entries: TranslationEntry[], options: ImportOptions): Promise<void> {
  const { kvNamespace, accountId, apiToken } = options;
  
  for (const entry of entries) {
    const key = `tm:${entry.locale}:${simpleHash(entry.original)}`;
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespace}/values/${key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      }
    );

    if (!response.ok) {
      console.error(`Failed to upload entry: ${entry.original.substring(0, 50)}...`);
    }
  }
}

function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function parseJSON(content: string): TranslationEntry[] {
  const data = JSON.parse(content);
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data.entries && Array.isArray(data.entries)) {
    return data.entries.map((e: any) => ({
      ...e,
      timestamp: e.timestamp || Date.now(),
      reviewed: true
    }));
  }
  
  throw new Error('Invalid JSON format');
}

function parseCSV(content: string): TranslationEntry[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  return records.map((record: any) => ({
    original: record['Original'] || record['original'],
    translated: record['Translated'] || record['translated'],
    locale: record['Locale'] || record['locale'],
    provider: record['Provider'] || record['provider'] || 'manual',
    reviewed: record['Reviewed'] === 'Yes' || record['reviewed'] === 'true',
    context: record['Context'] || record['context'],
    timestamp: Date.now()
  }));
}

async function checkExisting(key: string, options: ImportOptions): Promise<boolean> {
  const { kvNamespace, accountId, apiToken } = options;
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespace}/values/${key}`,
    {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    }
  );

  return response.ok;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.error('Usage: npm run import-tm <format> <input> <kv-namespace-id> <account-id> <api-token> [--overwrite]');
    console.error('Example: npm run import-tm json translations-fr.json abc123 def456 your-api-token --overwrite');
    process.exit(1);
  }

  const options: ImportOptions = {
    format: args[0] as 'json' | 'csv',
    input: args[1],
    kvNamespace: args[2],
    accountId: args[3],
    apiToken: args[4],
    overwrite: args.includes('--overwrite')
  };

  try {
    console.log(`Reading translations from ${options.input}...`);
    const content = readFileSync(options.input, 'utf-8');
    
    let entries: TranslationEntry[];
    
    if (options.format === 'json') {
      entries = parseJSON(content);
    } else if (options.format === 'csv') {
      entries = parseCSV(content);
    } else {
      throw new Error(`Unsupported format: ${options.format}`);
    }

    console.log(`Found ${entries.length} entries to import`);

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of entries) {
      const key = `tm:${entry.locale}:${simpleHash(entry.original)}`;
      
      if (!options.overwrite) {
        const exists = await checkExisting(key, options);
        if (exists) {
          skipped++;
          continue;
        }
      }

      try {
        await uploadToKV([entry], options);
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`  Imported ${imported} entries...`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to import: ${entry.original.substring(0, 50)}...`);
      }
    }

    console.log('\nImport Complete:');
    console.log(`  Imported: ${imported}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Failed: ${failed}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();