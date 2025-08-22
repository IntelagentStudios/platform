import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { prisma } from '@intelagent/database';
import { cache } from '@intelagent/redis';
import crypto from 'crypto';

interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    licenseKey: string;
    siteKey: string;
    domain: string;
    url: string;
    title?: string;
    description?: string;
    type: 'webpage' | 'faq' | 'product' | 'article' | 'custom';
    timestamp: string;
    chunks?: number;
  };
}

interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: any;
}

interface IndexingProgress {
  total: number;
  processed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class VectorStoreService {
  private pinecone: Pinecone | null = null;
  private openai: OpenAI | null = null;
  private index: any = null;
  private cache = cache; // Use the lazy-loaded cache from redis package
  private embeddingDimension = 1536; // OpenAI embedding dimension
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Initialize Pinecone
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_ENVIRONMENT) {
      try {
        this.pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY
        });
        
        // Get or create index
        const indexName = process.env.PINECONE_INDEX_NAME || 'chatbot';
        
        // Check if index exists
        const indexes = await this.pinecone.listIndexes();
        const indexExists = indexes.indexes?.some(idx => idx.name === indexName);
        
        if (!indexExists) {
          // Create index with appropriate configuration
          await this.pinecone.createIndex({
            name: indexName,
            dimension: this.embeddingDimension,
            metric: 'cosine',
            spec: {
              serverless: {
                cloud: 'aws',
                region: process.env.PINECONE_ENVIRONMENT || 'us-east-1'
              }
            }
          });
          
          console.log(`Created Pinecone index: ${indexName}`);
        }
        
        this.index = this.pinecone.index(indexName);
        console.log('Pinecone vector store initialized');
      } catch (error) {
        console.error('Failed to initialize Pinecone:', error);
      }
    }
    
    // Initialize OpenAI for embeddings
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  /**
   * Generate embeddings for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured for embeddings');
    }
    
    try {
      // Check cache first
      const cacheKey = `embedding:${crypto.createHash('md5').update(text).digest('hex')}`;
      const cached = await this.cache.get<number[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Generate new embedding
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      const embedding = response.data[0].embedding;
      
      // Cache the embedding
      await this.cache.set(cacheKey, embedding, 86400); // Cache for 24 hours
      
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(document: VectorDocument): Promise<void> {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }
    
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(document.content);
      
      // Use license key as namespace for complete isolation
      const namespace = document.metadata.licenseKey;
      
      // Prepare vector for Pinecone
      const vector = {
        id: document.id,
        values: embedding,
        metadata: {
          ...document.metadata,
          content: document.content.substring(0, 1000), // Store truncated content
          contentLength: document.content.length
        }
      };
      
      // Upsert to Pinecone with namespace
      await this.index.namespace(namespace).upsert([vector]);
      
      // Store full content in database for retrieval
      await prisma.vector_documents.upsert({
        where: { id: document.id },
        update: {
          content: document.content,
          metadata: document.metadata,
          license_key: document.metadata.licenseKey,
          updated_at: new Date()
        },
        create: {
          id: document.id,
          license_key: document.metadata.licenseKey,
          site_key: document.metadata.siteKey,
          content: document.content,
          metadata: document.metadata,
          created_at: new Date()
        }
      });
      
    } catch (error) {
      console.error('Failed to index document:', error);
      throw error;
    }
  }

  /**
   * Index multiple documents in batches
   */
  async indexDocuments(documents: VectorDocument[], batchSize: number = 10): Promise<IndexingProgress> {
    if (documents.length === 0) {
      throw new Error('No documents to index');
    }
    
    // Ensure all documents are for the same license key
    const licenseKey = documents[0].metadata.licenseKey;
    const invalidDocs = documents.filter(d => d.metadata.licenseKey !== licenseKey);
    if (invalidDocs.length > 0) {
      throw new Error('All documents must belong to the same license key');
    }
    
    const progress: IndexingProgress = {
      total: documents.length,
      processed: 0,
      failed: 0,
      status: 'processing'
    };
    
    // Store progress in Redis for real-time updates
    const progressKey = `indexing:${licenseKey}:${documents[0]?.metadata.siteKey}`;
    await this.cache.set(progressKey, progress);
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const vectors = [];
      
      for (const doc of batch) {
        try {
          const embedding = await this.generateEmbedding(doc.content);
          vectors.push({
            id: doc.id,
            values: embedding,
            metadata: {
              ...doc.metadata,
              content: doc.content.substring(0, 1000),
              contentLength: doc.content.length
            }
          });
          
          // Store full content in database
          await prisma.vector_documents.upsert({
            where: { id: doc.id },
            update: {
              content: doc.content,
              metadata: doc.metadata,
              license_key: doc.metadata.licenseKey,
              updated_at: new Date()
            },
            create: {
              id: doc.id,
              license_key: doc.metadata.licenseKey,
              site_key: doc.metadata.siteKey,
              content: doc.content,
              metadata: doc.metadata,
              created_at: new Date()
            }
          });
          
          progress.processed++;
        } catch (error) {
          console.error(`Failed to process document ${doc.id}:`, error);
          progress.failed++;
        }
      }
      
      // Batch upsert to Pinecone with namespace
      if (vectors.length > 0) {
        try {
          const namespace = documents[0].metadata.licenseKey;
          await this.index.namespace(namespace).upsert(vectors);
        } catch (error) {
          console.error('Failed to upsert batch to Pinecone:', error);
          progress.failed += vectors.length;
        }
      }
      
      // Update progress
      await this.cache.set(progressKey, progress);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    progress.status = progress.failed === 0 ? 'completed' : 'failed';
    await this.cache.set(progressKey, progress, 3600); // Keep for 1 hour
    
    return progress;
  }

  /**
   * Search for similar documents
   */
  async search(query: string, licenseKey: string, siteKey: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }
    
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search in Pinecone within the license-specific namespace
      // This ensures complete data isolation between tenants
      const searchResponse = await this.index.namespace(licenseKey).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: {
          siteKey: { $eq: siteKey }
        }
      });
      
      // Get full content from database
      const results: SearchResult[] = [];
      
      for (const match of searchResponse.matches || []) {
        // Double-check license key when retrieving from database
        const document = await prisma.vector_documents.findFirst({
          where: { 
            id: match.id,
            license_key: licenseKey // Ensure we only get documents for this license
          }
        });
        
        if (document) {
          results.push({
            id: match.id,
            score: match.score || 0,
            content: document.content,
            metadata: match.metadata
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Delete documents for a site
   */
  async deleteDocuments(licenseKey: string, siteKey: string): Promise<void> {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }
    
    try {
      // Get all document IDs for this site and license
      const documents = await prisma.vector_documents.findMany({
        where: { 
          license_key: licenseKey,
          site_key: siteKey 
        },
        select: { id: true }
      });
      
      const ids = documents.map(doc => doc.id);
      
      if (ids.length > 0) {
        // Delete from Pinecone namespace
        await this.index.namespace(licenseKey).deleteMany(ids);
        
        // Delete from database
        await prisma.vector_documents.deleteMany({
          where: { 
            license_key: licenseKey,
            site_key: siteKey 
          }
        });
      }
      
      console.log(`Deleted ${ids.length} documents for site ${siteKey}`);
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw error;
    }
  }

  /**
   * Get indexing progress
   */
  async getIndexingProgress(licenseKey: string, siteKey: string): Promise<IndexingProgress | null> {
    const progressKey = `indexing:${licenseKey}:${siteKey}`;
    return await this.cache.get<IndexingProgress>(progressKey);
  }

  /**
   * Generate contextual response using indexed documents
   */
  async generateResponse(query: string, licenseKey: string, siteKey: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }
    
    try {
      // Search for relevant documents within license namespace
      const searchResults = await this.search(query, licenseKey, siteKey, 3);
      
      if (searchResults.length === 0) {
        return "I don't have enough information to answer your question. Please contact support for assistance.";
      }
      
      // Build context from search results
      const context = searchResults
        .map(result => result.content)
        .join('\n\n---\n\n');
      
      // Generate response using GPT
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful customer support assistant. Answer questions based on the provided context. 
            If the context doesn't contain enough information, politely say so and suggest contacting support.
            Keep responses concise and friendly.`
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${query}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      return completion.choices[0].message.content || "I'm unable to generate a response at this time.";
    } catch (error) {
      console.error('Failed to generate response:', error);
      return "I'm experiencing technical difficulties. Please try again later.";
    }
  }

  /**
   * Check health of vector store
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const details: any = {
      pinecone: false,
      openai: false,
      database: false
    };
    
    try {
      // Check Pinecone
      if (this.pinecone && this.index) {
        const stats = await this.index.describeIndexStats();
        details.pinecone = true;
        details.vectorCount = stats.totalRecordCount || 0;
      }
      
      // Check OpenAI
      if (this.openai) {
        // Simple test embedding
        await this.generateEmbedding('test');
        details.openai = true;
      }
      
      // Check database
      const count = await prisma.vector_documents.count();
      details.database = true;
      details.documentCount = count;
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
    
    const healthy = details.pinecone && details.openai && details.database;
    
    return { healthy, details };
  }
}

// Singleton instance (lazy initialization)
let vectorStore: VectorStoreService | null = null;

function getVectorStore(): VectorStoreService {
  if (!vectorStore) {
    vectorStore = new VectorStoreService();
  }
  return vectorStore;
}

// Export functions for easy use
export async function indexWebsite(licenseKey: string, siteKey: string, domain: string, pages: any[]): Promise<IndexingProgress> {
  const documents: VectorDocument[] = pages.map((page, index) => ({
    id: `${siteKey}_${crypto.createHash('md5').update(page.url).digest('hex')}`,
    content: page.content || page.text || '',
    metadata: {
      licenseKey,
      siteKey,
      domain,
      url: page.url,
      title: page.title,
      description: page.description,
      type: page.type || 'webpage',
      timestamp: new Date().toISOString(),
      chunks: index
    }
  }));
  
  return await getVectorStore().indexDocuments(documents);
}

export async function searchKnowledgeBase(query: string, licenseKey: string, siteKey: string): Promise<SearchResult[]> {
  return await getVectorStore().search(query, licenseKey, siteKey);
}

export async function getChatbotResponse(query: string, licenseKey: string, siteKey: string): Promise<string> {
  return await getVectorStore().generateResponse(query, licenseKey, siteKey);
}

export async function deleteKnowledgeBase(licenseKey: string, siteKey: string): Promise<void> {
  return await getVectorStore().deleteDocuments(licenseKey, siteKey);
}

export async function getIndexingStatus(licenseKey: string, siteKey: string): Promise<IndexingProgress | null> {
  return await getVectorStore().getIndexingProgress(licenseKey, siteKey);
}

export { vectorStore, VectorStoreService, VectorDocument, SearchResult, IndexingProgress };