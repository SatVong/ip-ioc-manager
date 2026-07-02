import { PaginationQuery, PaginationOptions } from '../../src/types/pagination';

describe('Pagination Types', () => {
  it('should create valid PaginationQuery with defaults', () => {
    const query: PaginationQuery = {
      page: 1,
      limit: 10,
      sortBy: 'id',
      sortOrder: 'desc',
      filters: {},
      globalSearch: '',
    };

    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.sortBy).toBe('id');
    expect(query.sortOrder).toBe('desc');
    expect(query.filters).toEqual({});
    expect(query.globalSearch).toBe('');
  });

  it('should create valid PaginationOptions', () => {
    const options: PaginationOptions = {
      tableName: 'ip_records',
      columnMap: { 'id': 'id', 'IP-адресс': 'ip' },
      searchColumns: ['ip', 'from_source'],
    };

    expect(options.tableName).toBe('ip_records');
    expect(options.searchColumns).toHaveLength(2);
    expect(options.allowedLimits).toBeUndefined();
  });

  it('should use default allowedLimits when not provided', () => {
    const options: PaginationOptions = {
      tableName: 'ip_records',
      columnMap: {},
      searchColumns: [],
    };

    const limits = options.allowedLimits || [10, 25, 50, 100];
    expect(limits).toContain(10);
    expect(limits).toContain(25);
    expect(limits).toContain(50);
    expect(limits).toContain(100);
  });
});