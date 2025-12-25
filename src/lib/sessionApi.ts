// Server-side session management API
import { supabase } from './supabase';

export interface SessionValidation {
  valid: boolean;
  reason?: 'session_not_found' | 'session_closed' | 'session_expired' | 'session_mismatch';
  message?: string;
  session_id?: string;
  created_at?: string;
}

export interface TableSession {
  id: string;
  table_number: number;
  customer_phone: string;
  session_token: string;
  status: 'active' | 'closed';
  created_at: string;
  closed_at?: string;
}

/**
 * Create or get an active session for a table/phone combination
 */
export async function getOrCreateSession(
  tableNumber: number,
  customerPhone: string,
  sessionToken: string
): Promise<TableSession | null> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_session', {
      p_table_number: tableNumber,
      p_customer_phone: customerPhone,
      p_session_token: sessionToken
    });

    if (error) {
      console.error('[SessionAPI] Error creating session:', error);
      return null;
    }

    return data as TableSession;
  } catch (err) {
    console.error('[SessionAPI] Exception creating session:', err);
    return null;
  }
}

/**
 * Validate a session token
 */
export async function validateSession(
  tableNumber: number,
  customerPhone: string,
  sessionToken: string
): Promise<SessionValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_session', {
      p_table_number: tableNumber,
      p_customer_phone: customerPhone,
      p_session_token: sessionToken
    });

    if (error) {
      console.error('[SessionAPI] Error validating session:', error);
      return { 
        valid: false, 
        reason: 'session_not_found',
        message: 'Unable to validate session. Please try again.' 
      };
    }

    return data as SessionValidation;
  } catch (err) {
    console.error('[SessionAPI] Exception validating session:', err);
    return { 
      valid: false, 
      reason: 'session_not_found',
      message: 'Unable to validate session. Please try again.' 
    };
  }
}

/**
 * Close sessions when bill is paid
 * Called from Counter when processing payment
 */
export async function closeTableSessions(
  tableNumber: number,
  customerPhones: string[]
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('close_table_sessions', {
      p_table_number: tableNumber,
      p_customer_phones: customerPhones
    });

    if (error) {
      console.error('[SessionAPI] Error closing sessions:', error);
      return 0;
    }

    console.log(`[SessionAPI] Closed ${data} sessions for table ${tableNumber}`);
    return data as number;
  } catch (err) {
    console.error('[SessionAPI] Exception closing sessions:', err);
    return 0;
  }
}

/**
 * Check if a customer has an active session at a table
 */
export async function hasActiveSession(
  tableNumber: number,
  customerPhone: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('table_number', tableNumber)
      .eq('customer_phone', customerPhone)
      .eq('status', 'active')
      .gt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (error) {
      console.error('[SessionAPI] Error checking active session:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (err) {
    console.error('[SessionAPI] Exception checking active session:', err);
    return false;
  }
}

/**
 * Get the current session token from localStorage
 */
export function getLocalSessionToken(): string | null {
  try {
    const sessionKey = 'chiyadani:customerActiveSession';
    const existingSession = localStorage.getItem(sessionKey);
    if (existingSession) {
      const session = JSON.parse(existingSession);
      return session.sessionToken || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Generate a new session token
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
