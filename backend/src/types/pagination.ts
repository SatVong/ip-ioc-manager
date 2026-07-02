// Типы для пагинации
export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
  globalSearch: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ColumnMap {
  [key: string]: string;
}

export interface PaginationOptions {
  tableName: string;
  columnMap: ColumnMap;
  searchColumns: string[];
  allowedLimits?: number[];
}