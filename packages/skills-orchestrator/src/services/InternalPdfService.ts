/**
 * Internal PDF Generation Service
 * Our own PDF implementation without third-party APIs
 */

import { EventEmitter } from 'events';
import zlib from 'zlib';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface PdfOptions {
  content?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
  fileName?: string;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  header?: string;
  footer?: string;
  watermark?: string;
  licenseKey?: string;
  taskId?: string;
}

export interface PdfResult {
  documentId: string;
  fileName: string;
  buffer: Buffer;
  size: number;
  pageCount: number;
  createdAt: Date;
  provider: 'internal';
}

export class InternalPdfService extends EventEmitter {
  private static instance: InternalPdfService;
  private documentCache: Map<string, Buffer> = new Map();
  
  // PDF specifications
  private readonly PDF_VERSION = '1.7';
  private readonly PAGE_SIZES = {
    A4: { width: 595, height: 842 },
    Letter: { width: 612, height: 792 },
    Legal: { width: 612, height: 1008 }
  };
  
  private constructor() {
    super();
    this.initializeService();
  }
  
  public static getInstance(): InternalPdfService {
    if (!InternalPdfService.instance) {
      InternalPdfService.instance = new InternalPdfService();
    }
    return InternalPdfService.instance;
  }
  
  private initializeService() {
    console.log('[InternalPdfService] PDF generator initialized');
  }
  
  /**
   * Generate a PDF document
   */
  public async generate(options: PdfOptions): Promise<PdfResult> {
    const documentId = `pdf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Get page dimensions
      const pageSize = this.PAGE_SIZES[options.pageSize || 'A4'];
      const isLandscape = options.orientation === 'landscape';
      const width = isLandscape ? pageSize.height : pageSize.width;
      const height = isLandscape ? pageSize.width : pageSize.height;
      
      // Get margins
      const margins = {
        top: options.margins?.top || 50,
        bottom: options.margins?.bottom || 50,
        left: options.margins?.left || 50,
        right: options.margins?.right || 50
      };
      
      // Process content
      let content = '';
      if (options.html) {
        content = this.htmlToText(options.html);
      } else if (options.template && options.data) {
        content = this.processTemplate(options.template, options.data);
      } else {
        content = options.content || '';
      }
      
      // Build PDF structure
      const pdfObjects: any[] = [];
      let objectCount = 0;
      
      // 1. PDF Header
      const header = `%PDF-${this.PDF_VERSION}\n%âÃÏÓ\n`;
      
      // 2. Catalog object
      pdfObjects.push({
        id: ++objectCount,
        content: `${objectCount} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
      });
      
      // 3. Pages object
      pdfObjects.push({
        id: ++objectCount,
        content: `${objectCount} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
      });
      
      // 4. Page object
      const pageObj = ++objectCount;
      pdfObjects.push({
        id: pageObj,
        content: `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
      });
      
      // 5. Font object
      const fontObj = ++objectCount;
      pdfObjects.push({
        id: fontObj,
        content: `${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`
      });
      
      // 6. Content stream
      const contentStream = this.createContentStream(content, width, height, margins, options);
      const compressedContent = zlib.deflateSync(Buffer.from(contentStream));
      const contentObj = ++objectCount;
      pdfObjects.push({
        id: contentObj,
        content: `${contentObj} 0 obj\n<< /Length ${compressedContent.length} /Filter /FlateDecode >>\nstream\n${compressedContent.toString('binary')}\nendstream\nendobj\n`
      });
      
      // Add watermark if specified
      if (options.watermark) {
        const watermarkObj = ++objectCount;
        const watermarkStream = this.createWatermarkStream(options.watermark, width, height);
        pdfObjects.push({
          id: watermarkObj,
          content: `${watermarkObj} 0 obj\n<< /Length ${watermarkStream.length} >>\nstream\n${watermarkStream}\nendstream\nendobj\n`
        });
      }
      
      // Build cross-reference table
      let xref = 'xref\n';
      xref += `0 ${objectCount + 1}\n`;
      xref += '0000000000 65535 f \n';
      
      let offset = header.length;
      const offsets: number[] = [];
      
      for (const obj of pdfObjects) {
        offsets.push(offset);
        xref += `${offset.toString().padStart(10, '0')} 00000 n \n`;
        offset += obj.content.length;
      }
      
      // Trailer
      const trailer = `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;
      
      // Combine all parts
      let pdfContent = header;
      for (const obj of pdfObjects) {
        pdfContent += obj.content;
      }
      pdfContent += xref;
      pdfContent += trailer;
      
      // Convert to buffer
      const pdfBuffer = Buffer.from(pdfContent, 'binary');
      
      // Cache the document
      this.documentCache.set(documentId, pdfBuffer);
      
      // Clean old cache entries
      setTimeout(() => {
        this.documentCache.delete(documentId);
      }, 3600000); // 1 hour
      
      // Emit event
      this.emit('pdf:generated', {
        documentId,
        fileName: options.fileName || `document_${documentId}.pdf`,
        size: pdfBuffer.length,
        licenseKey: options.licenseKey,
        taskId: options.taskId
      });
      
      return {
        documentId,
        fileName: options.fileName || `document_${documentId}.pdf`,
        buffer: pdfBuffer,
        size: pdfBuffer.length,
        pageCount: Math.ceil(content.split('\n').length / 50), // Approximate
        createdAt: new Date(),
        provider: 'internal'
      };
      
    } catch (error: any) {
      console.error('[InternalPdfService] Generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
  
  /**
   * Create content stream for PDF
   */
  private createContentStream(
    text: string,
    width: number,
    height: number,
    margins: any,
    options: PdfOptions
  ): string {
    const lines = text.split('\n');
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const maxWidth = width - margins.left - margins.right;
    const maxLines = Math.floor((height - margins.top - margins.bottom) / lineHeight);
    
    let stream = 'BT\n'; // Begin text
    stream += `/F1 ${fontSize} Tf\n`; // Set font
    
    let y = height - margins.top;
    let lineCount = 0;
    
    // Add header if specified
    if (options.header) {
      stream += `${margins.left} ${y} Td\n`;
      stream += `(${this.escapeString(options.header)}) Tj\n`;
      y -= lineHeight * 2;
      lineCount += 2;
    }
    
    // Add content lines
    for (const line of lines) {
      if (lineCount >= maxLines - 2) break; // Leave space for footer
      
      const wrappedLines = this.wrapText(line, maxWidth, fontSize);
      for (const wrappedLine of wrappedLines) {
        if (lineCount >= maxLines - 2) break;
        
        stream += `${margins.left} ${y} Td\n`;
        stream += `(${this.escapeString(wrappedLine)}) Tj\n`;
        stream += `0 -${lineHeight} Td\n`; // Move to next line
        
        y -= lineHeight;
        lineCount++;
      }
    }
    
    // Add footer if specified
    if (options.footer) {
      y = margins.bottom + lineHeight;
      stream += `${margins.left} ${y} Td\n`;
      stream += `(${this.escapeString(options.footer)}) Tj\n`;
    }
    
    stream += 'ET\n'; // End text
    
    return stream;
  }
  
  /**
   * Create watermark stream
   */
  private createWatermarkStream(watermark: string, width: number, height: number): string {
    let stream = 'q\n'; // Save graphics state
    stream += '0.5 0 0 0.5 0 0 cm\n'; // Scale
    stream += '0.3 g\n'; // Set gray color
    stream += 'BT\n';
    stream += '/F1 48 Tf\n';
    stream += `${width / 4} ${height / 2} Td\n`;
    stream += '45 rotate\n'; // Rotate text
    stream += `(${this.escapeString(watermark)}) Tj\n`;
    stream += 'ET\n';
    stream += 'Q\n'; // Restore graphics state
    
    return stream;
  }
  
  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    // Basic HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Replace template variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }
  
  /**
   * Wrap text to fit width
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    const charWidth = fontSize * 0.5; // Approximate character width
    const maxChars = Math.floor(maxWidth / charWidth);
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxChars) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, split it
          lines.push(word.substring(0, maxChars));
          currentLine = word.substring(maxChars);
        }
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
  }
  
  /**
   * Escape string for PDF
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
  }
  
  /**
   * Merge multiple PDFs
   */
  public async merge(pdfBuffers: Buffer[]): Promise<PdfResult> {
    // Simple PDF merge implementation
    const documentId = `pdf_merged_${Date.now()}`;
    
    // For now, concatenate content (simplified)
    // In production, would properly merge PDF objects
    const mergedSize = pdfBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const mergedBuffer = Buffer.concat(pdfBuffers);
    
    return {
      documentId,
      fileName: `merged_${documentId}.pdf`,
      buffer: mergedBuffer,
      size: mergedSize,
      pageCount: pdfBuffers.length,
      createdAt: new Date(),
      provider: 'internal'
    };
  }
  
  /**
   * Convert PDF to images
   */
  public async toImages(pdfBuffer: Buffer): Promise<Buffer[]> {
    // Simplified implementation
    // In production, would render PDF pages to images
    const pageCount = 1; // Simplified
    const images: Buffer[] = [];
    
    for (let i = 0; i < pageCount; i++) {
      // Create a simple placeholder image
      const imageBuffer = Buffer.from(`Image data for page ${i + 1}`);
      images.push(imageBuffer);
    }
    
    return images;
  }
  
  /**
   * Get service status
   */
  public getStatus(): {
    ready: boolean;
    cacheSize: number;
    version: string;
  } {
    return {
      ready: true,
      cacheSize: this.documentCache.size,
      version: this.PDF_VERSION
    };
  }
}