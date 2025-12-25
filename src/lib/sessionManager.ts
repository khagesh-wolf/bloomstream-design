// Session management for customer table sessions
// Prevents reuse of old URLs after bill is paid

export const generateSessionToken = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export const getClosedSessions = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('chiyadani:closedSessions') || '[]');
  } catch {
    return [];
  }
};

export const addClosedSession = (sessionToken: string) => {
  const closed = getClosedSessions();
  if (!closed.includes(sessionToken)) {
    closed.push(sessionToken);
    // Keep only last 100 closed sessions to prevent localStorage bloat
    const trimmed = closed.slice(-100);
    localStorage.setItem('chiyadani:closedSessions', JSON.stringify(trimmed));
  }
};

export const isSessionClosed = (sessionToken: string): boolean => {
  return getClosedSessions().includes(sessionToken);
};

// Close session for a specific table/phone combination
// Called when bill is paid at counter
export const closeTableSession = (tableNumber: number, customerPhones: string[]) => {
  const sessionKey = 'chiyadani:customerActiveSession';
  const existingSession = localStorage.getItem(sessionKey);
  
  if (existingSession) {
    try {
      const session = JSON.parse(existingSession);
      // Check if current session matches the table and any of the customer phones
      if (session.table === tableNumber && 
          session.phone && 
          customerPhones.includes(session.phone) && 
          session.sessionToken) {
        addClosedSession(session.sessionToken);
        localStorage.removeItem(sessionKey);
        return true;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return false;
};

// Get current session token for a table/phone
export const getCurrentSessionToken = (): string | null => {
  const sessionKey = 'chiyadani:customerActiveSession';
  const existingSession = localStorage.getItem(sessionKey);
  
  if (existingSession) {
    try {
      const session = JSON.parse(existingSession);
      return session.sessionToken || null;
    } catch {
      return null;
    }
  }
  return null;
};
