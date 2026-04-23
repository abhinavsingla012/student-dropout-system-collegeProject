const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const defaultOrigin = 'http://localhost:3000';
const envApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const envSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

const apiBase = envApiBase
  ? trimTrailingSlash(envApiBase)
  : `${defaultOrigin}/api`;

const socketUrl = envSocketUrl
  ? trimTrailingSlash(envSocketUrl)
  : defaultOrigin;

export const API_BASE_URL = apiBase;
export const SOCKET_URL = socketUrl;
