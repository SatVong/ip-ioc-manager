import { pool } from '../db/pool';
import { PaginationQuery, PaginatedResponse, PaginationOptions } from '../types/pagination';

export async function getPaginatedData<T>(
  options: PaginationOptions,
  query: PaginationQuery
): Promise<PaginatedResponse<T>> {
  const {
    tableName,
    columnMap,
    searchColumns,
    allowedLimits = [10, 25, 50, 100],
  } = options;

  const page = Math.max(1, query.page);
  const limit = allowedLimits.includes(query.limit) ? query.limit : allowedLimits[0];
  const offset = (page - 1) * limit;
  const sortBy = columnMap[query.sortBy] || 'id';
  const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

  const whereClauses: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  // Фильтры по колонкам
  for (const [column, value] of Object.entries(query.filters)) {
    if (value && value !== '') {
      const dbColumn = columnMap[column];
      if (dbColumn) {
        if (dbColumn === 'mses') {
          const numbers = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            whereClauses.push(`${dbColumn} && $${paramIndex}::int[]`);
            queryParams.push(numbers);
            paramIndex++;
          }
        } else {
          whereClauses.push(`${dbColumn} ILIKE $${paramIndex}`);
          queryParams.push(`%${value}%`);
          paramIndex++;
        }
      }
    }
  }

  // Глобальный поиск
  if (query.globalSearch && query.globalSearch !== '') {
    const searchConditions = searchColumns.map(col => `${col} ILIKE $${paramIndex}`);
    whereClauses.push(`(${searchConditions.join(' OR ')})`);
    queryParams.push(`%${query.globalSearch}%`);
    paramIndex++;
  }

  const whereStr = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';

  // Основной запрос с пагинацией
  const dataQuery = `
    SELECT * FROM ${tableName}
    ${whereStr}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  // Запрос для подсчёта общего количества
  const countQuery = `
    SELECT COUNT(*) FROM ${tableName}
    ${whereStr}
  `;

  const queryParamsWithLimit = [...queryParams, limit, offset];

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, queryParamsWithLimit),
    pool.query(countQuery, queryParams),
  ]);

  return {
    data: dataResult.rows as T[],
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
  };
}