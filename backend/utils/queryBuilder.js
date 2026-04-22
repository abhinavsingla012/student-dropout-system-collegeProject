const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parseListOptions(query, allowedSortFields, defaultSort = '-createdAt') {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  let sort = defaultSort;
  if (query.sort) {
    const fields = String(query.sort)
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);

    if (fields.length) {
      const safeFields = fields.filter((field) => allowedSortFields.has(field.replace(/^-/, '')));
      if (safeFields.length) {
        sort = safeFields.join(' ');
      }
    }
  }

  return { page, limit, skip, sort };
}

export function buildPaginationMeta(total, { page, limit }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}
