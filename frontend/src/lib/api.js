export const API_BASE = import.meta.env.VITE_API_BASE ;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;
export const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH ;

export function apiUrl(path) {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
