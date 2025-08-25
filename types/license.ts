/**
 * Data Model Architecture:
 * - license_key: Primary identifier for a customer account (one per customer)
 * - site_key: Product-specific key for chatbot only
 * - Other products will have their own keys (campaign_key, api_key, etc.)
 * - ALL products trace back to the main license_key
 */

export interface License {
  license_key: string;          // Primary account identifier
  email?: string | null;
  products: string[];            // Array of purchased products
  is_pro: boolean;              // Platform tier
  domain?: string | null;
  status?: string | null;
  created_at?: Date | null;
  used_at?: Date | null;
  customer_name?: string | null;
  subscription_id?: string | null;
  subscription_status?: string | null;
  
  // Product-specific keys (each product has its own)
  site_key?: string | null;      // Chatbot product key
  // Future product keys:
  // campaign_key?: string | null;  // Sales agent product key
  // api_key?: string | null;       // Data enrichment product key
  // agent_key?: string | null;     // Setup agent product key
}

export interface ChatbotLog {
  id: number;
  site_key?: string | null;       // Links to chatbot product
  session_id?: string | null;
  customer_message?: string | null;
  chatbot_response?: string | null;
  timestamp?: Date | null;
  domain?: string | null;
  conversation_id?: string | null;
  intent_detected?: string | null;
  user_id?: string | null;
  role?: string | null;
  content?: string | null;
  created_at?: Date | null;
}

// Future product data models
export interface SalesData {
  id: number;
  license_key: string;           // Direct link to account
  campaign_key?: string | null;  // Product-specific identifier
  // ... sales-specific fields
}

export interface EnrichmentData {
  id: number;
  license_key: string;           // Direct link to account
  api_key?: string | null;       // Product-specific identifier
  // ... enrichment-specific fields
}

export interface User {
  id: string;
  email: string;
  license_key: string;           // Links user to their account
  role: 'customer' | 'master_admin' | 'team_member';
  name?: string;
  products?: string[];
  license_type?: 'platform' | 'pro_platform';
}

export const MASTER_ADMIN_KEY = 'INTL-ADMIN-KEY';
export const TEST_USER_KEY = 'INTL-AGNT-BOSS-MODE';
export const TEST_FRIEND_KEY = 'INTL-8K3M-QB7X-2024';

/**
 * Data Access Pattern:
 * 
 * 1. Get license_key from JWT token
 * 2. For chatbot: license_key → site_key → chatbot_logs
 * 3. For sales: license_key → sales_data (direct)
 * 4. For enrichment: license_key → enrichment_data (direct)
 * 
 * This ensures all data is properly scoped to the account (license_key)
 * while allowing product-specific routing via secondary keys.
 */