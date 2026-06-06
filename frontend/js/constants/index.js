// constants/index.js
// Глобальные константы приложения

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_USER = 'Администратор';

export const TABLE_COLUMNS = [
    'Где внесено',
    'Дата получения',
    'Откуда получено',
    'Раздел письма',
    'Домен',
    'IP-адресс',
    'Страна',
    'Владелец',
    'Как внесено на МСЭ',
    'Примечание к внесению',
    'Заявки',
    'Дата внесения',
    'Кто вносил',
    'Примечание к исключению',
    'Дата исключения',
    'Кто исключил',
    'Действия'
];

export const COLUMN_TYPES = {
    'Дата получения': 'date',
    'Дата внесения': 'date-readonly',
    'Дата исключения': 'date-readonly',
    'Кто вносил': 'readonly',
    'Кто исключил': 'readonly',
    'IP-адресс': 'ip',
    'Страна': 'country',
    'Откуда получено': 'text-64',
    'Раздел письма': 'text-24',
    'Домен': 'text-64',
    'Владелец': 'text-64',
    'Примечание к внесению': 'text-128',
    'Примечание к исключению': 'text-128',
    'Как внесено на МСЭ': 'mse-format',
    'Заявки': 'text-64'
};

export const MSE_NAMES = {
    1: '1-PT AF',
    2: '2-NGENIX',
    3: '3-PT AF (DN)',
    4: '4-PT AF (GR)',
    5: '5-Mitigator (DN)',
    6: '6-Mitigator (GR)',
    7: '7-Континент',
    8: '8-UG',
    9: '9-Mitigator (IL)',
    10: '10-SIEM',
    11: '11-KATA',
    12: '12-SIEM',
    13: '13-KATA',
    14: '14-UG',
    15: '15-Mitigator'
};

export const IOC_SOURCE_NAMES = {
    1: '1-SIEM',
    2: '2-KATA',
    3: '3-PT Sandbox',
    4: '4-LOKI',
    5: '5-SIEM',
    6: '6-KATA'
};