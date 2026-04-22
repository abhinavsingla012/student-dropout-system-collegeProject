const formatMeta = (meta = {}) => {
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return '';
  }
  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
};

export const logInfo = (message, meta) => {
  console.log(`[${new Date().toISOString()}] INFO ${message}${formatMeta(meta)}`);
};

export const logWarn = (message, meta) => {
  console.warn(`[${new Date().toISOString()}] WARN ${message}${formatMeta(meta)}`);
};

export const logError = (message, meta) => {
  console.error(`[${new Date().toISOString()}] ERROR ${message}${formatMeta(meta)}`);
};
