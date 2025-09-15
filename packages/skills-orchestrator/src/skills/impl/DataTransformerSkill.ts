/**
 * Data Transformer Skill
 * Transforms data between different formats and structures
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class DataTransformerSkill extends BaseSkill {
  metadata = {
    id: 'data_transformer',
    name: 'Data Transformer',
    description: 'Transform data between different formats and structures',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['transform', 'convert', 'data', 'format']
  };

  validate(params: SkillParams): boolean {
    return !!(params.data && params.transformation);
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { data, transformation, options = {} } = params;
      let transformedData: any;
      let transformationDetails: any = {};

      switch (transformation) {
        case 'flatten':
          transformedData = this.flattenObject(data, options);
          transformationDetails.type = 'Object flattening';
          break;
        case 'unflatten':
          transformedData = this.unflattenObject(data, options);
          transformationDetails.type = 'Object unflattening';
          break;
        case 'normalize':
          transformedData = this.normalizeData(data, options);
          transformationDetails.type = 'Data normalization';
          break;
        case 'pivot':
          transformedData = this.pivotData(data, options);
          transformationDetails.type = 'Data pivoting';
          break;
        case 'aggregate':
          transformedData = this.aggregateData(data, options);
          transformationDetails.type = 'Data aggregation';
          break;
        case 'filter':
          transformedData = this.filterData(data, options);
          transformationDetails.type = 'Data filtering';
          break;
        case 'map':
          transformedData = this.mapData(data, options);
          transformationDetails.type = 'Data mapping';
          break;
        case 'sort':
          transformedData = this.sortData(data, options);
          transformationDetails.type = 'Data sorting';
          break;
        case 'group':
          transformedData = this.groupData(data, options);
          transformationDetails.type = 'Data grouping';
          break;
        case 'join':
          transformedData = this.joinData(data, options);
          transformationDetails.type = 'Data joining';
          break;
        case 'format':
          transformedData = this.formatData(data, options);
          transformationDetails.type = 'Data formatting';
          break;
        case 'clean':
          transformedData = this.cleanData(data, options);
          transformationDetails.type = 'Data cleaning';
          break;
        default:
          throw new Error(`Unknown transformation: ${transformation}`);
      }

      // Calculate transformation metrics
      const metrics = this.calculateTransformationMetrics(data, transformedData);

      return {
        success: true,
        data: {
          original: options.includeOriginal ? data : undefined,
          transformed: transformedData,
          transformation: transformationDetails,
          metrics,
          timestamp: new Date()
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private flattenObject(obj: any, options: any = {}): any {
    const delimiter = options.delimiter || '.';
    const maxDepth = options.maxDepth || 10;
    
    const flatten = (ob: any, prefix = '', depth = 0): any => {
      if (depth >= maxDepth) return { [prefix]: ob };
      
      const result: any = {};
      
      for (const key in ob) {
        if (ob.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
          
          if (typeof ob[key] === 'object' && ob[key] !== null && !Array.isArray(ob[key])) {
            Object.assign(result, flatten(ob[key], newKey, depth + 1));
          } else if (Array.isArray(ob[key]) && options.flattenArrays) {
            ob[key].forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                Object.assign(result, flatten(item, `${newKey}${delimiter}${index}`, depth + 1));
              } else {
                result[`${newKey}${delimiter}${index}`] = item;
              }
            });
          } else {
            result[newKey] = ob[key];
          }
        }
      }
      
      return result;
    };
    
    return flatten(obj);
  }

  private unflattenObject(obj: any, options: any = {}): any {
    const delimiter = options.delimiter || '.';
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keys = key.split(delimiter);
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          const nextKey = keys[i + 1];
          const isArrayIndex = /^\d+$/.test(nextKey);
          
          if (!current[k]) {
            current[k] = isArrayIndex ? [] : {};
          }
          
          current = current[k];
        }
        
        const lastKey = keys[keys.length - 1];
        current[lastKey] = obj[key];
      }
    }
    
    return result;
  }

  private normalizeData(data: any, options: any = {}): any {
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeItem(item, options));
    }
    return this.normalizeItem(data, options);
  }

  private normalizeItem(item: any, options: any): any {
    const normalized: any = {};
    
    for (const key in item) {
      if (item.hasOwnProperty(key)) {
        let value = item[key];
        let normalizedKey = key;
        
        // Normalize key
        if (options.keyCase === 'lower') {
          normalizedKey = key.toLowerCase();
        } else if (options.keyCase === 'upper') {
          normalizedKey = key.toUpperCase();
        } else if (options.keyCase === 'camel') {
          normalizedKey = this.toCamelCase(key);
        } else if (options.keyCase === 'snake') {
          normalizedKey = this.toSnakeCase(key);
        }
        
        // Normalize value
        if (typeof value === 'string') {
          if (options.trimStrings) {
            value = value.trim();
          }
          if (options.removeEmptyStrings && value === '') {
            continue;
          }
          if (options.stringCase === 'lower') {
            value = value.toLowerCase();
          } else if (options.stringCase === 'upper') {
            value = value.toUpperCase();
          }
        } else if (value === null || value === undefined) {
          if (options.removeNulls) {
            continue;
          }
          if (options.convertNulls) {
            value = options.nullValue || '';
          }
        } else if (typeof value === 'number') {
          if (options.roundNumbers) {
            value = Math.round(value);
          }
          if (options.precision !== undefined) {
            value = Number(value.toFixed(options.precision));
          }
        }
        
        normalized[normalizedKey] = value;
      }
    }
    
    return normalized;
  }

  private pivotData(data: any[], options: any = {}): any {
    if (!Array.isArray(data)) {
      throw new Error('Pivot requires array input');
    }
    
    const { rowKey, columnKey, valueKey, aggregation = 'sum' } = options;
    
    if (!rowKey || !columnKey || !valueKey) {
      throw new Error('Pivot requires rowKey, columnKey, and valueKey');
    }
    
    const result: any = {};
    
    data.forEach(item => {
      const row = item[rowKey];
      const col = item[columnKey];
      const val = item[valueKey];
      
      if (!result[row]) {
        result[row] = {};
      }
      
      if (!result[row][col]) {
        result[row][col] = [];
      }
      
      result[row][col].push(val);
    });
    
    // Apply aggregation
    for (const row in result) {
      for (const col in result[row]) {
        const values = result[row][col];
        result[row][col] = this.aggregate(values, aggregation);
      }
    }
    
    return result;
  }

  private aggregateData(data: any[], options: any = {}): any {
    if (!Array.isArray(data)) {
      throw new Error('Aggregate requires array input');
    }
    
    const { groupBy, aggregations } = options;
    const result: any = {};
    
    if (groupBy) {
      // Group data first
      const grouped = this.groupData(data, { key: groupBy });
      
      // Apply aggregations to each group
      for (const key in grouped) {
        result[key] = this.applyAggregations(grouped[key], aggregations);
      }
    } else {
      // Apply aggregations to entire dataset
      result.total = this.applyAggregations(data, aggregations);
    }
    
    return result;
  }

  private filterData(data: any, options: any = {}): any {
    const { conditions, operator = 'and' } = options;
    
    if (!conditions || conditions.length === 0) {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.filter(item => this.evaluateConditions(item, conditions, operator));
    }
    
    // For objects, filter properties
    const filtered: any = {};
    for (const key in data) {
      if (this.evaluateConditions({ key, value: data[key] }, conditions, operator)) {
        filtered[key] = data[key];
      }
    }
    
    return filtered;
  }

  private mapData(data: any, options: any = {}): any {
    const { mapping, template } = options;
    
    if (Array.isArray(data)) {
      return data.map(item => this.mapItem(item, mapping, template));
    }
    
    return this.mapItem(data, mapping, template);
  }

  private mapItem(item: any, mapping: any, template: any): any {
    if (template) {
      // Use template-based mapping
      return this.applyTemplate(item, template);
    }
    
    if (mapping) {
      // Use field mapping
      const mapped: any = {};
      for (const key in mapping) {
        const sourceKey = mapping[key];
        if (typeof sourceKey === 'function') {
          mapped[key] = sourceKey(item);
        } else if (typeof sourceKey === 'string') {
          mapped[key] = this.getNestedValue(item, sourceKey);
        } else {
          mapped[key] = sourceKey;
        }
      }
      return mapped;
    }
    
    return item;
  }

  private sortData(data: any, options: any = {}): any {
    if (!Array.isArray(data)) {
      return data;
    }
    
    const { key, order = 'asc', type = 'auto' } = options;
    
    return [...data].sort((a, b) => {
      let aVal = key ? this.getNestedValue(a, key) : a;
      let bVal = key ? this.getNestedValue(b, key) : b;
      
      // Type conversion
      if (type === 'number') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (type === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (type === 'auto') {
        // Auto-detect type
        if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
          aVal = Number(aVal);
          bVal = Number(bVal);
        }
      }
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private groupData(data: any[], options: any = {}): any {
    if (!Array.isArray(data)) {
      throw new Error('Group requires array input');
    }
    
    const { key, multiLevel = false } = options;
    
    if (!key) {
      throw new Error('Group requires a key');
    }
    
    const groups: any = {};
    
    data.forEach(item => {
      const groupKey = Array.isArray(key) 
        ? key.map(k => this.getNestedValue(item, k)).join('_')
        : this.getNestedValue(item, key);
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(item);
    });
    
    return groups;
  }

  private joinData(data: any, options: any = {}): any {
    const { joinWith, on, type = 'inner' } = options;
    
    if (!joinWith || !on) {
      throw new Error('Join requires joinWith data and on key');
    }
    
    const result: any[] = [];
    
    if (type === 'inner') {
      data.forEach((item: any) => {
        const matches = joinWith.filter((j: any) => 
          this.getNestedValue(item, on) === this.getNestedValue(j, on)
        );
        matches.forEach((match: any) => {
          result.push({ ...item, ...match });
        });
      });
    } else if (type === 'left') {
      data.forEach((item: any) => {
        const matches = joinWith.filter((j: any) => 
          this.getNestedValue(item, on) === this.getNestedValue(j, on)
        );
        if (matches.length > 0) {
          matches.forEach((match: any) => {
            result.push({ ...item, ...match });
          });
        } else {
          result.push(item);
        }
      });
    }
    
    return result;
  }

  private formatData(data: any, options: any = {}): any {
    const { format, locale = 'en-US' } = options;
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.toCSV(data);
    } else if (format === 'xml') {
      return this.toXML(data);
    } else if (format === 'table') {
      return this.toTable(data);
    }
    
    return data;
  }

  private cleanData(data: any, options: any = {}): any {
    if (Array.isArray(data)) {
      return data.map(item => this.cleanItem(item, options)).filter(item => item !== null);
    }
    return this.cleanItem(data, options);
  }

  private cleanItem(item: any, options: any): any {
    if (item === null || item === undefined) {
      return options.removeNulls ? null : item;
    }
    
    if (typeof item === 'string') {
      let cleaned = item.trim();
      
      if (options.removeSpecialChars) {
        cleaned = cleaned.replace(/[^\w\s]/g, '');
      }
      
      if (options.removeNumbers) {
        cleaned = cleaned.replace(/\d/g, '');
      }
      
      if (options.removeExtraSpaces) {
        cleaned = cleaned.replace(/\s+/g, ' ');
      }
      
      return cleaned === '' && options.removeEmpty ? null : cleaned;
    }
    
    if (typeof item === 'object') {
      const cleaned: any = {};
      for (const key in item) {
        const cleanedValue = this.cleanItem(item[key], options);
        if (cleanedValue !== null || !options.removeNulls) {
          cleaned[key] = cleanedValue;
        }
      }
      return Object.keys(cleaned).length === 0 && options.removeEmpty ? null : cleaned;
    }
    
    return item;
  }

  // Helper methods
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private aggregate(values: any[], type: string): any {
    if (values.length === 0) return null;
    
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
      case 'mean':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'first':
        return values[0];
      case 'last':
        return values[values.length - 1];
      default:
        return values;
    }
  }

  private applyAggregations(data: any[], aggregations: any): any {
    const result: any = {};
    
    if (!aggregations) return result;
    
    for (const key in aggregations) {
      const agg = aggregations[key];
      const values = data.map(item => this.getNestedValue(item, agg.field || key));
      result[key] = this.aggregate(values, agg.type || 'sum');
    }
    
    return result;
  }

  private evaluateConditions(item: any, conditions: any[], operator: string): boolean {
    const results = conditions.map(condition => this.evaluateCondition(item, condition));
    
    if (operator === 'and') {
      return results.every(r => r);
    } else if (operator === 'or') {
      return results.some(r => r);
    }
    
    return false;
  }

  private evaluateCondition(item: any, condition: any): boolean {
    const { field, operator, value } = condition;
    const itemValue = this.getNestedValue(item, field);
    
    switch (operator) {
      case 'eq':
      case '=':
        return itemValue === value;
      case 'ne':
      case '!=':
        return itemValue !== value;
      case 'gt':
      case '>':
        return itemValue > value;
      case 'gte':
      case '>=':
        return itemValue >= value;
      case 'lt':
      case '<':
        return itemValue < value;
      case 'lte':
      case '<=':
        return itemValue <= value;
      case 'contains':
        return String(itemValue).includes(value);
      case 'startsWith':
        return String(itemValue).startsWith(value);
      case 'endsWith':
        return String(itemValue).endsWith(value);
      case 'in':
        return Array.isArray(value) && value.includes(itemValue);
      case 'notIn':
        return Array.isArray(value) && !value.includes(itemValue);
      default:
        return false;
    }
  }

  private applyTemplate(item: any, template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.getNestedValue(item, key) || '';
    });
  }

  private toCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  private toXML(data: any, rootName = 'root'): string {
    const toXMLNode = (obj: any, nodeName: string): string => {
      if (obj === null || obj === undefined) {
        return `<${nodeName}/>`; 
      }
      
      if (typeof obj !== 'object') {
        return `<${nodeName}>${obj}</${nodeName}>`;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => toXMLNode(item, 'item')).join('');
      }
      
      const children = Object.entries(obj)
        .map(([key, value]) => toXMLNode(value, key))
        .join('');
      
      return `<${nodeName}>${children}</${nodeName}>`;
    };
    
    return `<?xml version="1.0" encoding="UTF-8"?>\n${toXMLNode(data, rootName)}`;
  }

  private toTable(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return 'No data';
    
    const headers = Object.keys(data[0]);
    const maxLengths = headers.map(header => 
      Math.max(header.length, ...data.map(item => String(item[header] || '').length))
    );
    
    const separator = '+' + maxLengths.map(len => '-'.repeat(len + 2)).join('+') + '+';
    const headerRow = '| ' + headers.map((h, i) => h.padEnd(maxLengths[i])).join(' | ') + ' |';
    const dataRows = data.map(item => 
      '| ' + headers.map((h, i) => String(item[h] || '').padEnd(maxLengths[i])).join(' | ') + ' |'
    );
    
    return [separator, headerRow, separator, ...dataRows, separator].join('\n');
  }

  private calculateTransformationMetrics(original: any, transformed: any): any {
    const originalSize = JSON.stringify(original).length;
    const transformedSize = JSON.stringify(transformed).length;
    
    return {
      originalSize,
      transformedSize,
      sizeChange: transformedSize - originalSize,
      sizeChangePercent: ((transformedSize - originalSize) / originalSize * 100).toFixed(2) + '%',
      originalType: Array.isArray(original) ? 'array' : typeof original,
      transformedType: Array.isArray(transformed) ? 'array' : typeof transformed,
      originalCount: Array.isArray(original) ? original.length : (typeof original === 'object' ? Object.keys(original).length : 1),
      transformedCount: Array.isArray(transformed) ? transformed.length : (typeof transformed === 'object' ? Object.keys(transformed).length : 1)
    };
  }

  getConfig(): Record<string, any> {
    return {
      transformations: [
        'flatten', 'unflatten', 'normalize', 'pivot', 'aggregate',
        'filter', 'map', 'sort', 'group', 'join', 'format', 'clean'
      ],
      formats: ['json', 'csv', 'xml', 'table'],
      aggregations: ['sum', 'avg', 'min', 'max', 'count', 'first', 'last'],
      joinTypes: ['inner', 'left']
    };
  }
}