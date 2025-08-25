export interface License {
  license_key: string;
  email?: string | null;
  site_key?: string | null;
  products: string[];
  is_pro: boolean;
  domain?: string | null;
  status?: string | null;
  created_at?: Date | null;
  used_at?: Date | null;
  customer_name?: string | null;
  subscription_id?: string | null;
  subscription_status?: string | null;
}

export interface ChatbotLog {
  id: number;
  session_id?: string | null;
  customer_message?: string | null;
  chatbot_response?: string | null;
  timestamp?: Date | null;
  site_key?: string | null;
  domain?: string | null;
  conversation_id?: string | null;
  intent_detected?: string | null;
  user_id?: string | null;
  role?: string | null;
  content?: string | null;
  created_at?: Date | null;
}

export interface User {
  id: string;
  email: string;
  license_key: string;
  role: 'customer' | 'master_admin' | 'team_member';
  name?: string;
  site_key?: string;
  products?: string[];
  license_type?: 'platform' | 'pro_platform';
}

export const MASTER_ADMIN_KEY = 'INTL-ADMIN-KEY';
export const TEST_USER_KEY = 'INTL-AGNT-BOSS-MODE';
export const TEST_FRIEND_KEY = 'INTL-8K3M-QB7X-2024';