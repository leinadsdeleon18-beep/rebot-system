const storageKey = 'rebot_reload_session';

function restoreOnReload() {
  try {
    // A search result or direct link starts a new document navigation.
    const navigation = window.performance.getEntriesByType('navigation')[0];
    if (navigation?.type !== 'reload') {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
    return typeof saved?.token === 'string' && saved.token && typeof saved.user?.role === 'string'
      ? saved
      : null;
  } catch {
    return null;
  }
}

let session = restoreOnReload();

export const getAuthToken = () => session?.token ?? null;
export const getSessionUser = () => session?.user ?? null;

export function setAuthSession(token, user) {
  session = token && user ? { token, user } : null;

  try {
    if (session) {
      window.sessionStorage.setItem(storageKey, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // In-app sign-in still works when browser storage is unavailable.
  }
}

export function updateSessionUser(changes) {
  if (session) setAuthSession(session.token, { ...session.user, ...changes });
}
