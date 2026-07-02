import { Request, Response } from 'express';
import { pool } from '../db/pool';

// Вспомогательные функции для генерации демо-данных
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomIP = () => `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
const randomWhiteIP = () => {
  const nets = ['10', '172.16', '192.168'];
  const net = nets[randomInt(0, 2)];
  return net === '10' ? `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
       : net === '172.16' ? `172.16.${randomInt(0, 255)}.${randomInt(1, 254)}`
       : `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`;
};
const randomDate = () => {
  const d = new Date(2024, randomInt(0, 11), randomInt(1, 28));
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};
const randomHash = () => {
  const chars = 'abcdef0123456789';
  const lengths = [32, 40, 64, 128];
  const len = lengths[randomInt(0, 3)];
  let hash = '';
  for (let i = 0; i < len; i++) hash += chars[randomInt(0, chars.length - 1)];
  return { hash, encoding: len === 32 ? 'md5' : len === 40 ? 'sha1' : len === 64 ? 'sha256' : 'sha512' };
};

const mseSources = [
  '1-PT AF', '2-NGENIX', '3-PT AF (DN)', '4-PT AF (GR)', '5-Mitigator (DN)',
  '6-Mitigator (GR)', '7-Континент', '8-UG', '9-Mitigator (IL)', '10-SIEM',
  '11-KATA', '12-SIEM', '13-KATA', '14-UG', '15-Mitigator',
];
const iocMseSources = ['1-SIEM', '2-KATA', '3-PT Sandbox', '4-LOKI', '5-SIEM', '6-KATA'];
const countries = ['RU', 'RU', 'RU', 'US', 'CN', 'DE', 'NL', 'FR', 'GB', 'JP'];
const owners = ['Cloudflare, Inc.', 'Google LLC', 'Microsoft Corp.', 'Amazon AWS', 'Yandex LLC', 'VK Group', 'Rostelecom', '-'];
const letters = ['п.4', 'п.5', 'Приложение к п.3', 'п.2.1', '-', 'п.7'];
const domains = ['example.com', 'malware.test', 'phishing.net', 'botnet.org', 'c2-server.ru', '-', 'trojan.cn'];
const statuses = ['Malicious', 'Suspicious', 'Clean', 'Unknown', 'Красный', 'Зеленый'];
const whoUsers = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Admin', 'Смирнова А.В.'];
const notes = [
  'Заблокирован по предписанию', 'Обнаружен в трафике', 'Подозрительная активность',
  'Фишинговая атака', 'C2 сервер', 'Вредоносное ПО', '-', 'DDoS атака',
];
const soibInfrs = ['СОИБ-2024-001', 'СОИБ-2024-002', '-', 'СОИБ-2024-003', '-', '-', 'СОИБ-2024-004'];

async function checkAdmin(req: Request, res: Response): Promise<boolean> {
  const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user!.userId]);
  if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
    res.status(403).json({ error: 'Только администратор может выполнять эту операцию' });
    return false;
  }
  return true;
}

export async function seedDemoData(req: Request, res: Response): Promise<void> {
  try {
    if (!(await checkAdmin(req, res))) return;

    const counts = { ip: 0, white_ip: 0, ioc: 0 };

    // IP Records (35 записей)
    for (let i = 0; i < 35; i++) {
      const mseCount = randomInt(1, 5);
      const mses: number[] = [];
      for (let j = 0; j < mseCount; j++) {
        const num = randomInt(1, 15);
        if (!mses.includes(num)) mses.push(num);
      }
      mses.sort((a, b) => a - b);

      const ip = randomIP();
      const date = randomDate();
      const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;

      await pool.query(
        `INSERT INTO ip_records (mses, date, from_source, letter, domain, ip, country, owner, mse_method, note_in, soib_infr, date_in, who_in)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [mses, date, mseSources[randomInt(0, 14)], letters[randomInt(0, 5)], domains[randomInt(0, 6)],
         ip, countries[randomInt(0, 9)], owners[randomInt(0, 7)], '-',
         notes[randomInt(0, 7)], soibInfrs[randomInt(0, 6)], dateIn, whoUsers[randomInt(0, 4)]]
      );
      counts.ip++;
    }

    // White IP Records (35 записей)
    for (let i = 0; i < 35; i++) {
      const mseCount = randomInt(1, 4);
      const mses: number[] = [];
      for (let j = 0; j < mseCount; j++) {
        const num = randomInt(1, 15);
        if (!mses.includes(num)) mses.push(num);
      }
      mses.sort((a, b) => a - b);

      const ip = randomWhiteIP();
      const date = randomDate();
      const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;

      await pool.query(
        `INSERT INTO white_ip_records (mses, date, from_source, letter, ip, mse_method, note_in, soib_infr, date_in, who_in)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [mses, date, mseSources[randomInt(0, 14)], letters[randomInt(0, 5)],
         ip, `${ip.split('.').slice(0, 3).join('.')}.0/${[8, 16, 24][randomInt(0, 2)]}`,
         notes[randomInt(0, 7)], soibInfrs[randomInt(0, 6)], dateIn, whoUsers[randomInt(0, 4)]]
      );
      counts.white_ip++;
    }

    // IOC Records (35 записей)
    for (let i = 0; i < 35; i++) {
      const mseCount = randomInt(1, 3);
      const mses: number[] = [];
      for (let j = 0; j < mseCount; j++) {
        const num = randomInt(1, 6);
        if (!mses.includes(num)) mses.push(num);
      }
      mses.sort((a, b) => a - b);

      const { hash, encoding } = randomHash();
      const date = randomDate();
      const dateIn = `${date} ${String(randomInt(8, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;

      await pool.query(
        `INSERT INTO ioc_records (mses, date, from_source, letter, indicator, encoding, status_opentip, status_virustotal, note_in, date_in, who_in)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [mses, date, iocMseSources[randomInt(0, 5)], letters[randomInt(0, 5)],
         hash, encoding, statuses[randomInt(0, 5)], statuses[randomInt(0, 5)],
         notes[randomInt(0, 7)], dateIn, whoUsers[randomInt(0, 4)]]
      );
      counts.ioc++;
    }

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'SEED_DEMO_DATA', JSON.stringify(counts)]
    );

    res.json({
      success: true,
      message: `✅ Демо-данные добавлены: IP источников — ${counts.ip}, Белых IP — ${counts.white_ip}, IOC хешей — ${counts.ioc}`,
      counts,
    });
  } catch (err) {
    console.error('Ошибка при заполнении демо-данными:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при заполнении демо-данными' });
  }
}

export async function clearIpRecords(req: Request, res: Response): Promise<void> {
  try {
    if (!(await checkAdmin(req, res))) return;

    const countResult = await pool.query('SELECT COUNT(*) FROM ip_records');
    const count = parseInt(countResult.rows[0].count, 10);

    await pool.query('TRUNCATE TABLE ip_records RESTART IDENTITY');

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'CLEAR_IP_RECORDS', JSON.stringify({ deleted_count: count })]
    );

    res.json({ success: true, message: `Очищено ${count} записей из таблицы IP источников` });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при очистке таблицы' });
  }
}

export async function clearIocRecords(req: Request, res: Response): Promise<void> {
  try {
    if (!(await checkAdmin(req, res))) return;

    const countResult = await pool.query('SELECT COUNT(*) FROM ioc_records');
    const count = parseInt(countResult.rows[0].count, 10);

    await pool.query('TRUNCATE TABLE ioc_records RESTART IDENTITY');

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'CLEAR_IOC_RECORDS', JSON.stringify({ deleted_count: count })]
    );

    res.json({ success: true, message: `Очищено ${count} записей из таблицы IOC хешей` });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).json({ error: 'Ошибка при очистке таблицы' });
  }
}

export async function clearUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!(await checkAdmin(req, res))) return;

    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE id != $1', [req.user!.userId]);
    const count = parseInt(countResult.rows[0].count, 10);

    if (count === 0) {
      res.json({ success: true, message: 'Нет пользователей для очистки (кроме администратора)' });
      return;
    }

    await pool.query('BEGIN');
    await pool.query('DELETE FROM user_logs WHERE user_id IN (SELECT id FROM users WHERE id != $1)', [req.user!.userId]);
    await pool.query('DELETE FROM users WHERE id != $1', [req.user!.userId]);
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 2');

    await pool.query(
      'INSERT INTO user_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user!.userId, 'CLEAR_USERS', JSON.stringify({ deleted_count: count })]
    );

    await pool.query('COMMIT');

    res.json({ success: true, message: `Очищено ${count} пользователей. Администратор сохранён.` });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при очистке пользователей:', (err as Error).message);
    res.status(500).json({ error: 'Ошибка при очистке пользователей' });
  }
}