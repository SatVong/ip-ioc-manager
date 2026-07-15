import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IP/IOC Manager API',
      version: '2.0.0',
      description: 'REST API для системы управления IP-адресами и индикаторами компрометации (IOC)',
      contact: {
        name: 'IP/IOC Manager Support',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Production server (через Nginx)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Local development server (без Nginx)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Сообщение об ошибке' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Операция выполнена' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            full_name: { type: 'string', example: 'Главный администратор' },
            position: { type: 'string', example: 'Руководитель отдела' },
            department: { type: 'string', example: 'IT-безопасность' },
            email: { type: 'string', example: 'admin@local' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
            can_create: { type: 'boolean', example: true },
            can_edit: { type: 'boolean', example: true },
            can_delete: { type: 'boolean', example: false },
            can_import: { type: 'boolean', example: false },
            can_export: { type: 'boolean', example: true },
            can_manage_users: { type: 'boolean', example: false },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        IpRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            mses: { type: 'array', items: { type: 'integer' }, example: [1, 3, 5] },
            date: { type: 'string', example: '25.12.2024' },
            from_source: { type: 'string', example: 'ФСТЭК 240/92/2544' },
            letter: { type: 'string', example: 'п.4' },
            domain: { type: 'string', example: 'example.com' },
            ip: { type: 'string', example: '192.168.1.1' },
            country: { type: 'string', example: 'RU' },
            owner: { type: 'string', example: 'Cloudflare, Inc.' },
            mse_method: { type: 'string', example: '-' },
            note_in: { type: 'string', example: 'Заблокирован по предписанию' },
            soib_infr: { type: 'string', example: 'СОИБ-2024-001' },
            date_in: { type: 'string', example: '25.12.2024 14:30' },
            who_in: { type: 'string', example: 'Иванов И.И.' },
            note_out: { type: 'string', example: '-' },
            date_out: { type: 'string', example: '-' },
            who_out: { type: 'string', example: '-' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/IpRecord' } },
            total: { type: 'integer', example: 150 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 15 },
          },
        },
        IocRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            mses: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
            date: { type: 'string', example: '25.12.2024' },
            from_source: { type: 'string', example: 'ФСТЭК 240/92/2544' },
            letter: { type: 'string', example: 'п.4' },
            indicator: { type: 'string', example: 'd41d8cd98f00b204e9800998ecf8427e' },
            encoding: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512'], example: 'md5' },
            status_opentip: { type: 'string', example: 'Malicious' },
            status_virustotal: { type: 'string', example: 'Malicious' },
            note_in: { type: 'string', example: 'Обнаружен в трафике' },
            date_in: { type: 'string', example: '25.12.2024 14:30' },
            who_in: { type: 'string', example: 'Петров П.П.' },
            note_out: { type: 'string', example: '-' },
            date_out: { type: 'string', example: '-' },
            who_out: { type: 'string', example: '-' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        WhiteIpRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            mses: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
            date: { type: 'string', example: '25.12.2024' },
            from_source: { type: 'string', example: 'Аналитический центр' },
            letter: { type: 'string', example: 'IN-2024-001' },
            ip: { type: 'string', example: '10.0.0.1' },
            mse_method: { type: 'string', example: '10.0.0.0/8' },
            note_in: { type: 'string', example: 'Внутренний адрес' },
            soib_infr: { type: 'string', example: '-' },
            date_in: { type: 'string', example: '25.12.2024 14:30' },
            who_in: { type: 'string', example: 'Сидоров С.С.' },
            note_out: { type: 'string', example: '-' },
            date_out: { type: 'string', example: '-' },
            who_out: { type: 'string', example: '-' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        AdminClearResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Очищено 150 записей из таблицы IP источников' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalIpRecords: { type: 'integer', example: 1250 },
            totalIocRecords: { type: 'integer', example: 340 },
            totalWhiteIpRecords: { type: 'integer', example: 85 },
            totalUsers: { type: 'integer', example: 5 },
            activeUsers: { type: 'integer', example: 3 },
          },
        },
        TopCountry: {
          type: 'object',
          properties: {
            country: { type: 'string', example: 'RU' },
            count: { type: 'integer', example: 450 },
          },
        },
        TimelineItem: {
          type: 'object',
          properties: {
            month: { type: 'string', example: '2024-12' },
            count: { type: 'integer', example: 120 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Авторизация'],
          summary: 'Вход в систему',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            '200': { description: 'Успешный вход', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            '401': { description: 'Неверные учетные данные' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Авторизация'],
          summary: 'Данные текущего пользователя',
          responses: {
            '200': { description: 'Данные пользователя', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            '401': { description: 'Не авторизован' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Авторизация'],
          summary: 'Выход из системы',
          responses: { '200': { description: 'Выход выполнен' } },
        },
      },
      '/api/users': {
        get: {
          tags: ['Пользователи'],
          summary: 'Список пользователей',
          responses: {
            '200': { description: 'Список пользователей', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
            '403': { description: 'Недостаточно прав' },
          },
        },
        post: {
          tags: ['Пользователи'],
          summary: 'Создать пользователя',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            '201': { description: 'Пользователь создан' },
            '400': { description: 'Ошибка валидации' },
            '403': { description: 'Недостаточно прав' },
          },
        },
      },
      '/api/records': {
        get: {
          tags: ['IP Источники'],
          summary: 'Все IP записи',
          responses: { '200': { description: 'Список записей', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/IpRecord' } } } } } },
        },
        post: {
          tags: ['IP Источники'],
          summary: 'Создать IP запись',
          responses: { '201': { description: 'Запись создана' } },
        },
      },
      '/api/records/paginated': {
        get: {
          tags: ['IP Источники'],
          summary: 'IP записи с пагинацией',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'id' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'filters', in: 'query', schema: { type: 'string' } },
            { name: 'globalSearch', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Пагинированный ответ', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
        },
      },
      '/api/ioc-records': {
        get: {
          tags: ['IOC Хеши'],
          summary: 'Все IOC записи',
          responses: { '200': { description: 'Список записей', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/IocRecord' } } } } } },
        },
        post: {
          tags: ['IOC Хеши'],
          summary: 'Создать IOC запись',
          responses: { '201': { description: 'Запись создана' } },
        },
      },
      '/api/ioc-records/paginated': {
        get: {
          tags: ['IOC Хеши'],
          summary: 'IOC записи с пагинацией',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'id' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'filters', in: 'query', schema: { type: 'string' } },
            { name: 'globalSearch', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Пагинированный ответ' } },
        },
      },
      '/api/white-ip-records/paginated': {
        get: {
          tags: ['Белые IP'],
          summary: 'White IP записи с пагинацией',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'id' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'filters', in: 'query', schema: { type: 'string' } },
            { name: 'globalSearch', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Пагинированный ответ' } },
        },
      },
      '/api/admin/seed-demo-data': {
        post: {
          tags: ['Администрирование'],
          summary: 'Заполнить демо-данными',
          responses: {
            '200': { description: 'Демо-данные добавлены' },
            '403': { description: 'Только администратор' },
          },
        },
      },
      '/api/admin/clear-ip-records': {
        delete: {
          tags: ['Администрирование'],
          summary: 'Очистить таблицу IP источников',
          responses: { '200': { description: 'Таблица очищена' }, '403': { description: 'Только администратор' } },
        },
      },
      '/api/admin/clear-ioc-records': {
        delete: {
          tags: ['Администрирование'],
          summary: 'Очистить таблицу IOC хешей',
          responses: { '200': { description: 'Таблица очищена' }, '403': { description: 'Только администратор' } },
        },
      },
      '/api/admin/clear-white-ip-records': {
        delete: {
          tags: ['Администрирование'],
          summary: 'Очистить таблицу белых IP',
          responses: { '200': { description: 'Таблица очищена' }, '403': { description: 'Только администратор' } },
        },
      },
      '/api/admin/clear-users': {
        delete: {
          tags: ['Администрирование'],
          summary: 'Очистить список пользователей',
          responses: { '200': { description: 'Пользователи очищены' }, '403': { description: 'Только администратор' } },
        },
      },
      '/api/test': {
        get: {
          tags: ['Система'],
          summary: 'Проверка сервера',
          security: [],
          responses: { '200': { description: 'Сервер работает' } },
        },
      },
      '/api/health': {
        get: {
          tags: ['Система'],
          summary: 'Healthcheck',
          security: [],
          responses: { '200': { description: 'Сервер здоров' } },
        },
      },
      '/api/dashboard/stats': {
        get: {
          tags: ['Дашборд'],
          summary: 'Статистика дашборда',
          description: 'Возвращает общее количество записей по всем таблицам и количество пользователей',
          responses: {
            '200': { description: 'Статистика', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStats' } } } },
            '401': { description: 'Не авторизован' },
          },
        },
      },
      '/api/dashboard/top-countries': {
        get: {
          tags: ['Дашборд'],
          summary: 'Топ стран по IP',
          description: 'Возвращает N стран с наибольшим количеством IP-записей',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 }, description: 'Количество стран (по умолчанию 5)' },
          ],
          responses: {
            '200': { description: 'Список стран', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TopCountry' } } } } },
            '401': { description: 'Не авторизован' },
          },
        },
      },
      '/api/dashboard/timeline': {
        get: {
          tags: ['Дашборд'],
          summary: 'Таймлайн записей',
          description: 'Возвращает количество IP-записей по месяцам',
          responses: {
            '200': { description: 'Таймлайн', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TimelineItem' } } } } },
            '401': { description: 'Не авторизован' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;