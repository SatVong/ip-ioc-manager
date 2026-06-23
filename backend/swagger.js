// swagger.js
// Swagger/OpenAPI документация

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'IP/IOC Manager API',
            version: '1.0.0',
            description: 'REST API для системы управления IP-адресами и индикаторами компрометации (IOC)',
            contact: {
                name: 'IP/IOC Manager Support'
            }
        },
        servers: [
            {
                url: 'http://192.168.52.145:3000',
                description: 'Production server'
            },
            {
                url: 'http://localhost:3000',
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                // ==================== ОБЩИЕ СХЕМЫ ====================
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Сообщение об ошибке' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Операция выполнена' }
                    }
                },

                // ==================== ПОЛЬЗОВАТЕЛЬ ====================
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
                        last_login: { type: 'string', format: 'date-time' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'admin' },
                        password: { type: 'string', example: 'admin123' }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['username', 'password'],
                    properties: {
                        username: { type: 'string', example: 'newuser' },
                        password: { type: 'string', minLength: 6, example: 'securepass123' },
                        full_name: { type: 'string', example: 'Новый Пользователь' },
                        position: { type: 'string', example: 'Аналитик' },
                        department: { type: 'string', example: 'SOC' },
                        email: { type: 'string', format: 'email', example: 'user@company.ru' },
                        role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
                        can_create: { type: 'boolean', default: true },
                        can_edit: { type: 'boolean', default: true },
                        can_delete: { type: 'boolean', default: false },
                        can_import: { type: 'boolean', default: false },
                        can_export: { type: 'boolean', default: true },
                        can_manage_users: { type: 'boolean', default: false }
                    }
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        full_name: { type: 'string' },
                        position: { type: 'string' },
                        department: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['admin', 'user'] },
                        password: { type: 'string', minLength: 6 },
                        can_create: { type: 'boolean' },
                        can_edit: { type: 'boolean' },
                        can_delete: { type: 'boolean' },
                        can_import: { type: 'boolean' },
                        can_export: { type: 'boolean' },
                        can_manage_users: { type: 'boolean' },
                        is_active: { type: 'boolean' }
                    }
                },
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string', example: 'oldpass123' },
                        newPassword: { type: 'string', minLength: 12, example: 'newsecurepass456' }
                    }
                },
                ToggleUserRequest: {
                    type: 'object',
                    properties: {
                        is_active: { type: 'boolean', example: false }
                    }
                },
                DeleteResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Пользователь полностью удалён' },
                        deleted: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                username: { type: 'string' }
                            }
                        }
                    }
                },

                // ==================== IP RECORD ====================
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
                        mask: { type: 'string', example: '24' },
                        country: { type: 'string', example: 'RU' },
                        owner: { type: 'string', example: 'Cloudflare, Inc.' },
                        mse_method: { type: 'string', example: '192.168.1.0/24' },
                        note_in: { type: 'string', example: 'Заблокирован по предписанию' },
                        soib_infr: { type: 'string', example: 'СОИБ-2024-001' },
                        date_in: { type: 'string', example: '25.12.2024 14:30' },
                        who_in: { type: 'string', example: 'Иванов И.И.' },
                        note_out: { type: 'string', example: '-' },
                        date_out: { type: 'string', example: '-' },
                        who_out: { type: 'string', example: '-' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateIpRecordRequest: {
                    type: 'object',
                    properties: {
                        mses: { type: 'array', items: { type: 'integer' }, example: [] },
                        date: { type: 'string', example: '25.12.2024' },
                        from_source: { type: 'string', example: 'ФСТЭК 240/92/2544' },
                        letter: { type: 'string', example: 'п.4' },
                        domain: { type: 'string', example: 'example.com' },
                        ip: { type: 'string', example: '192.168.1.1' },
                        country: { type: 'string', example: 'RU' },
                        owner: { type: 'string', example: 'Cloudflare, Inc.' },
                        mse_method: { type: 'string', example: '-' },
                        note_in: { type: 'string', example: 'Заблокирован' },
                        soib_infr: { type: 'string', example: '-' },
                        date_in: { type: 'string', example: '25.12.2024 14:30' },
                        who_in: { type: 'string', example: 'Иванов И.И.' },
                        note_out: { type: 'string', example: '-' },
                        date_out: { type: 'string', example: '-' },
                        who_out: { type: 'string', example: '-' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/IpRecord' } },
                        total: { type: 'integer', example: 150 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 15 }
                    }
                },
                DeleteRecordResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Запись удалена' },
                        deleted: { $ref: '#/components/schemas/IpRecord' }
                    }
                },

                // ==================== IOC RECORD ====================
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
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateIocRecordRequest: {
                    type: 'object',
                    properties: {
                        mses: { type: 'array', items: { type: 'integer' }, example: [] },
                        date: { type: 'string', example: '25.12.2024' },
                        from_source: { type: 'string', example: 'ФСТЭК 240/92/2544' },
                        letter: { type: 'string', example: 'п.4' },
                        indicator: { type: 'string', example: 'd41d8cd98f00b204e9800998ecf8427e' },
                        encoding: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512'], example: 'md5' },
                        status_opentip: { type: 'string', example: 'Malicious' },
                        status_virustotal: { type: 'string', example: 'Malicious' },
                        note_in: { type: 'string', example: '-' },
                        date_in: { type: 'string', example: '25.12.2024 14:30' },
                        who_in: { type: 'string', example: 'Петров П.П.' },
                        note_out: { type: 'string', example: '-' },
                        date_out: { type: 'string', example: '-' },
                        who_out: { type: 'string', example: '-' }
                    }
                },
                IocPaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/IocRecord' } },
                        total: { type: 'integer', example: 80 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 8 }
                    }
                },

                // ==================== WHITE IP RECORD ====================
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
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateWhiteIpRecordRequest: {
                    type: 'object',
                    properties: {
                        mses: { type: 'array', items: { type: 'integer' }, example: [] },
                        date: { type: 'string', example: '25.12.2024' },
                        from_source: { type: 'string', example: 'Аналитический центр' },
                        letter: { type: 'string', example: 'IN-2024-001' },
                        ip: { type: 'string', example: '10.0.0.1' },
                        mse_method: { type: 'string', example: '-' },
                        note_in: { type: 'string', example: 'Внутренний адрес' },
                        soib_infr: { type: 'string', example: '-' },
                        date_in: { type: 'string', example: '25.12.2024 14:30' },
                        who_in: { type: 'string', example: 'Сидоров С.С.' },
                        note_out: { type: 'string', example: '-' },
                        date_out: { type: 'string', example: '-' },
                        who_out: { type: 'string', example: '-' }
                    }
                },
                WhiteIpPaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/WhiteIpRecord' } },
                        total: { type: 'integer', example: 30 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalPages: { type: 'integer', example: 3 }
                    }
                },

                // ==================== АДМИНСКИЕ ОПЕРАЦИИ ====================
                AdminClearResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Очищено 150 записей из таблицы IP источников' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        paths: {
            // ==================== АВТОРИЗАЦИЯ ====================
            '/api/auth/login': {
                post: {
                    tags: ['Авторизация'],
                    summary: 'Вход в систему',
                    description: 'Аутентификация пользователя и получение JWT токена',
                    security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Успешный вход',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/LoginResponse' }
                                }
                            }
                        },
                        '401': {
                            description: 'Неверные учетные данные',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/auth/me': {
                get: {
                    tags: ['Авторизация'],
                    summary: 'Данные текущего пользователя',
                    description: 'Возвращает информацию о текущем авторизованном пользователе',
                    responses: {
                        '200': {
                            description: 'Данные пользователя',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        },
                        '401': { description: 'Не авторизован' }
                    }
                }
            },
            '/api/auth/logout': {
                post: {
                    tags: ['Авторизация'],
                    summary: 'Выход из системы',
                    responses: {
                        '200': { description: 'Выход выполнен' }
                    }
                }
            },

            // ==================== ПОЛЬЗОВАТЕЛИ ====================
            '/api/users': {
                get: {
                    tags: ['Пользователи'],
                    summary: 'Список пользователей',
                    description: 'Получить всех пользователей (требуются права админа или can_manage_users)',
                    responses: {
                        '200': {
                            description: 'Список пользователей',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        },
                        '403': { description: 'Недостаточно прав' }
                    }
                },
                post: {
                    tags: ['Пользователи'],
                    summary: 'Создать пользователя',
                    description: 'Создать нового пользователя (только для админа)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateUserRequest' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Пользователь создан',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        },
                        '400': { description: 'Ошибка валидации' },
                        '403': { description: 'Недостаточно прав' }
                    }
                }
            },
            '/api/users/{id}': {
                get: {
                    tags: ['Пользователи'],
                    summary: 'Получить пользователя по ID',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Данные пользователя',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/User' }
                                }
                            }
                        },
                        '404': { description: 'Пользователь не найден' }
                    }
                },
                put: {
                    tags: ['Пользователи'],
                    summary: 'Обновить пользователя',
                    description: 'Обновить данные пользователя (только для админа)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UpdateUserRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Пользователь обновлён' },
                        '403': { description: 'Недостаточно прав' },
                        '404': { description: 'Пользователь не найден' }
                    }
                },
                delete: {
                    tags: ['Пользователи'],
                    summary: 'Удалить пользователя',
                    description: 'Полное удаление пользователя (только для админа)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Пользователь удалён',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/DeleteResponse' }
                                }
                            }
                        },
                        '400': { description: 'Нельзя удалить самого себя' },
                        '403': { description: 'Недостаточно прав' }
                    }
                }
            },
            '/api/users/{id}/password': {
                put: {
                    tags: ['Пользователи'],
                    summary: 'Сменить пароль',
                    description: 'Пользователь меняет свой пароль',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ChangePasswordRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Пароль изменён' },
                        '401': { description: 'Неверный текущий пароль' },
                        '403': { description: 'Нельзя менять пароль другого пользователя' }
                    }
                }
            },
            '/api/users/{id}/toggle': {
                patch: {
                    tags: ['Пользователи'],
                    summary: 'Блокировка/разблокировка',
                    description: 'Заблокировать или разблокировать пользователя (только для админа)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ToggleUserRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Статус изменён' },
                        '403': { description: 'Только администратор' }
                    }
                }
            },

            // ==================== IP RECORDS ====================
            '/api/records': {
                get: {
                    tags: ['IP Источники'],
                    summary: 'Все IP записи',
                    responses: {
                        '200': {
                            description: 'Список записей',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/IpRecord' }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['IP Источники'],
                    summary: 'Создать IP запись',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateIpRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Запись создана',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/IpRecord' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/records/paginated': {
                get: {
                    tags: ['IP Источники'],
                    summary: 'IP записи с пагинацией',
                    description: 'Получить записи с пагинацией, сортировкой, фильтрацией и поиском',
                    parameters: [
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, enum: [10, 25, 50, 100] } },
                        { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'id' } },
                        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'asc' } },
                        { 
                            name: 'filters', 
                            in: 'query', 
                            description: 'JSON-строка с фильтрами, например: {"Страна":"RU","IP-адресс":"192.168"}',
                            schema: { type: 'string' }
                        },
                        { name: 'globalSearch', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Пагинированный ответ',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/PaginatedResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/records/{id}': {
                get: {
                    tags: ['IP Источники'],
                    summary: 'Получить IP запись по ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Запись найдена',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/IpRecord' }
                                }
                            }
                        },
                        '404': { description: 'Запись не найдена' }
                    }
                },
                put: {
                    tags: ['IP Источники'],
                    summary: 'Обновить IP запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateIpRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Запись обновлена' },
                        '404': { description: 'Запись не найдена' }
                    }
                },
                delete: {
                    tags: ['IP Источники'],
                    summary: 'Удалить IP запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Запись удалена',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/DeleteRecordResponse' }
                                }
                            }
                        },
                        '404': { description: 'Запись не найдена' }
                    }
                }
            },

            // ==================== IOC RECORDS ====================
            '/api/ioc-records': {
                get: {
                    tags: ['IOC Хеши'],
                    summary: 'Все IOC записи',
                    responses: {
                        '200': {
                            description: 'Список записей',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/IocRecord' }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['IOC Хеши'],
                    summary: 'Создать IOC запись',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateIocRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Запись создана',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/IocRecord' }
                                }
                            }
                        }
                    }
                }
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
                        { name: 'globalSearch', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Пагинированный ответ',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/IocPaginatedResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/ioc-records/{id}': {
                get: {
                    tags: ['IOC Хеши'],
                    summary: 'Получить IOC запись по ID',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Запись найдена',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/IocRecord' }
                                }
                            }
                        },
                        '404': { description: 'Запись не найдена' }
                    }
                },
                put: {
                    tags: ['IOC Хеши'],
                    summary: 'Обновить IOC запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateIocRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Запись обновлена' },
                        '404': { description: 'Запись не найдена' }
                    }
                },
                delete: {
                    tags: ['IOC Хеши'],
                    summary: 'Удалить IOC запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': { description: 'Запись удалена' },
                        '404': { description: 'Запись не найдена' }
                    }
                }
            },

            // ==================== WHITE IP RECORDS ====================
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
                        { name: 'globalSearch', in: 'query', schema: { type: 'string' } }
                    ],
                    responses: {
                        '200': {
                            description: 'Пагинированный ответ',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/WhiteIpPaginatedResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/white-ip-records': {
                post: {
                    tags: ['Белые IP'],
                    summary: 'Создать White IP запись',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateWhiteIpRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Запись создана',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/WhiteIpRecord' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/white-ip-records/{id}': {
                put: {
                    tags: ['Белые IP'],
                    summary: 'Обновить White IP запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CreateWhiteIpRecordRequest' }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Запись обновлена' },
                        '404': { description: 'Запись не найдена' }
                    }
                },
                delete: {
                    tags: ['Белые IP'],
                    summary: 'Удалить White IP запись',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    responses: {
                        '200': { description: 'Запись удалена' },
                        '404': { description: 'Запись не найдена' }
                    }
                }
            },

            // ==================== АДМИНСКИЕ ОПЕРАЦИИ ====================
            '/api/admin/clear-ip-records': {
                delete: {
                    tags: ['Администрирование'],
                    summary: 'Очистить таблицу IP источников',
                    description: 'Полная очистка таблицы ip_records (только для админа)',
                    responses: {
                        '200': {
                            description: 'Таблица очищена',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/AdminClearResponse' }
                                }
                            }
                        },
                        '403': { description: 'Только администратор' }
                    }
                }
            },
            '/api/admin/clear-ioc-records': {
                delete: {
                    tags: ['Администрирование'],
                    summary: 'Очистить таблицу IOC хешей',
                    description: 'Полная очистка таблицы ioc_records (только для админа)',
                    responses: {
                        '200': {
                            description: 'Таблица очищена',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/AdminClearResponse' }
                                }
                            }
                        },
                        '403': { description: 'Только администратор' }
                    }
                }
            },
            '/api/admin/clear-users': {
                delete: {
                    tags: ['Администрирование'],
                    summary: 'Очистить список пользователей',
                    description: 'Удалить всех пользователей кроме текущего админа',
                    responses: {
                        '200': {
                            description: 'Пользователи очищены',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/AdminClearResponse' }
                                }
                            }
                        },
                        '403': { description: 'Только администратор' }
                    }
                }
            },

            // ==================== ПРОЧЕЕ ====================
            '/api/test': {
                get: {
                    tags: ['Система'],
                    summary: 'Проверка сервера',
                    security: [],
                    responses: {
                        '200': {
                            description: 'Сервер работает',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string', example: 'Сервер работает!' },
                                            time: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: [] // Не используем JSDoc-аннотации, вся документация здесь
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;