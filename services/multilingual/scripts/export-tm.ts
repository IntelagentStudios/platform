#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { TranslationEntry } from '../src/types';

interface ExportOptions {
  format: 'json' | 'csv';
  locale: string;
  output: string;
  kvNamespace: string;
  accountId: string;
  apiToken: string;
}

async function fetchFromKV(options: ExportOptions): Promise<TranslationEntry[]> {
  const { kvNamespace, accountId, apiToken, locale } = options;
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespace}/keys?prefix=tm:${locale}:`,
    {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch keys: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const entries: TranslationEntry[] = [];

  for (const key of data.result) {
    const valueResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespace}/values/${key.name}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      }
    );

    if (valueResponse.ok) {
      const entry = await valueResponse.json() as TranslationEntry;
      entries.push(entry);
    }
  }

  return entries;
}

function exportToJSON(entries: TranslationEntry[], output: string): void {
  const data = {
    exportDate: new Date().toISOString(),
    totalEntries: entries.length,
    entries: entries.map(e => ({
      original: e.original,
      translated: e.translated,
      locale: e.locale,
      provider: e.provider,
      reviewed: e.reviewed || false,
      context: e.context
    }))
  };

  writeFileSync(output, JSON.stringify(data, null, 2));
  console.log(`✓ Exported ${entries.length} entries to ${output}`);
}

function exportToCSV(entries: TranslationEntry[], output: string): void {
  const headers = ['Original', 'Translated', 'Locale', 'Provider', 'Reviewed', 'Context'];
  const rows = entries.map(e => [
    escapeCSV(e.original),
    escapeCSV(e.translated),
    e.locale,
    e.provider,
    e.reviewed ? 'Yes' : 'No',
    escapeCSV(e.context || '')
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  writeFileSync(output, csv);
  console.log(`✓ Exported ${entries.length} entries to ${output}`);
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 6) {
    console.error('Usage: npm run export-tm <locale> <format> <output> <kv-namespace-id> <account-id> <api-token>');
    console.error('Example: npm run export-tm fr json translations-fr.json abc123 def456 your-api-token');
    process.exit(1);
  }

  const options: ExportOptions = {
    locale: args[0],
    format: args[1] as 'json' | 'csv',
    output: args[2],
    kvNamespace: args[3],
    accountId: args[4],
    apiToken: args[5]
  };

  try {
    console.log(`Fetching translations for locale: ${options.locale}...`);
    const entries = await fetchFromKV(options);

    if (options.format === 'json') {
      exportToJSON(entries, options.output);
    } else if (options.format === 'csv') {
      exportToCSV(entries, options.output);
    } else {
      throw new Error(`Unsupported format: ${options.format}`);
    }

    const stats = {
      total: entries.length,
      reviewed: entries.filter(e => e.reviewed).length,
      unreviewed: entries.filter(e => !e.reviewed).length,
      byProvider: entries.reduce((acc, e) => {
        acc[e.provider] = (acc[e.provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('\nExport Statistics:');
    console.log(`  Total entries: ${stats.total}`);
    console.log(`  Reviewed: ${stats.reviewed}`);
    console.log(`  Unreviewed: ${stats.unreviewed}`);
    console.log('  By provider:');
    Object.entries(stats.byProvider).forEach(([provider, count]) => {
      console.log(`    ${provider}: ${count}`);
    });

  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

main();