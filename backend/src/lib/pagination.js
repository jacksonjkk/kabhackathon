export function getPagination(query, defaults = {}) {
  const maxLimit = defaults.maxLimit ?? 100;
  const defaultLimit = defaults.limit ?? 20;

  let page = Number.parseInt(String(query.page ?? "1"), 10);
  let limit = Number.parseInt(String(query.limit ?? String(defaultLimit)), 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function paginated(data, total, page, limit) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
