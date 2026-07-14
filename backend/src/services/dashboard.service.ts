import { pool } from '../db/pool';

export interface DashboardStats {
  totalIpRecords: number;
  totalIocRecords: number;
  totalWhiteIpRecords: number;
  totalUsers: number;
  activeUsers: number;
}

export interface TopCountry {
  country: string;
  count: number;
}

export interface TimelineItem {
  month: string;
  count: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [ipResult, iocResult, whiteIpResult, usersResult, activeUsersResult] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM ip_records'),
    pool.query('SELECT COUNT(*) FROM ioc_records'),
    pool.query('SELECT COUNT(*) FROM white_ip_records'),
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
  ]);

  return {
    totalIpRecords: parseInt(ipResult.rows[0].count, 10),
    totalIocRecords: parseInt(iocResult.rows[0].count, 10),
    totalWhiteIpRecords: parseInt(whiteIpResult.rows[0].count, 10),
    totalUsers: parseInt(usersResult.rows[0].count, 10),
    activeUsers: parseInt(activeUsersResult.rows[0].count, 10),
  };
}

export async function getTopCountries(limit: number = 5): Promise<TopCountry[]> {
  const result = await pool.query(
    `SELECT country, COUNT(*) as count 
     FROM ip_records 
     WHERE country IS NOT NULL AND country != '' 
     GROUP BY country 
     ORDER BY count DESC 
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(row => ({
    country: row.country,
    count: parseInt(row.count, 10),
  }));
}

export async function getTimeline(): Promise<TimelineItem[]> {
  // Группируем по месяцам на основе created_at
  const result = await pool.query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
      COUNT(*) as count
    FROM ip_records
    WHERE created_at IS NOT NULL
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC
  `);

  return result.rows.map(row => ({
    month: row.month,
    count: parseInt(row.count, 10),
  }));
}

export interface AppearanceData {
  label: string;
  count: number;
}

export async function getAppearance(period: string, type: string): Promise<AppearanceData[]> {
  let tableName: string;
  switch (type) {
    case 'ip':
      tableName = 'ip_records';
      break;
    case 'ioc':
      tableName = 'ioc_records';
      break;
    case 'white-ip':
      tableName = 'white_ip_records';
      break;
    default:
      throw new Error(`Unknown type: ${type}`);
  }

  let dateTrunc: string;
  let orderFormat: string;
  let labelFormat: string;

  switch (period) {
    case 'week':
      dateTrunc = 'week';
      orderFormat = 'YYYY-MM-DD';
      labelFormat = 'DD.MM';
      break;
    case 'month':
      dateTrunc = 'month';
      orderFormat = 'YYYY-MM';
      labelFormat = 'MM.YYYY';
      break;
    case 'quarter':
      dateTrunc = 'quarter';
      orderFormat = 'YYYY-"Q"Q';
      labelFormat = 'YYYY-"Q"Q';
      break;
    case 'year':
      dateTrunc = 'year';
      orderFormat = 'YYYY';
      labelFormat = 'YYYY';
      break;
    default:
      dateTrunc = 'month';
      orderFormat = 'YYYY-MM';
      labelFormat = 'MM.YYYY';
  }

  const result = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC($1::text, created_at), $2::text) as label,
       COUNT(*) as count
     FROM ${tableName}
     WHERE created_at IS NOT NULL
     GROUP BY DATE_TRUNC($1::text, created_at)
     ORDER BY MIN(created_at) ASC`,
    [dateTrunc, orderFormat]
  );

  return result.rows.map(row => ({
    label: row.label,
    count: parseInt(row.count, 10),
  }));
}