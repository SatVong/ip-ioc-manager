import { body, param, query, ValidationChain } from 'express-validator';

// Валидация логина
export const loginValidation: ValidationChain[] = [
  body('username')
    .notEmpty().withMessage('Имя пользователя обязательно')
    .isString().withMessage('Имя пользователя должно быть строкой')
    .trim(),
  body('password')
    .notEmpty().withMessage('Пароль обязателен')
    .isString().withMessage('Пароль должен быть строкой'),
];

// Валидация создания пользователя
export const createUserValidation: ValidationChain[] = [
  body('username')
    .notEmpty().withMessage('Имя пользователя обязательно')
    .isLength({ min: 3, max: 50 }).withMessage('Имя пользователя должно быть от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Имя пользователя может содержать только буквы, цифры и _')
    .trim(),
  body('password')
    .notEmpty().withMessage('Пароль обязателен')
    .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Неверный формат email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Роль должна быть admin или user'),
];

// Валидация обновления пользователя
export const updateUserValidation: ValidationChain[] = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Неверный формат email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Роль должна быть admin или user'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
];

// Валидация смены пароля
export const changePasswordValidation: ValidationChain[] = [
  param('id').isInt().withMessage('ID должен быть числом'),
  body('currentPassword')
    .notEmpty().withMessage('Текущий пароль обязателен'),
  body('newPassword')
    .notEmpty().withMessage('Новый пароль обязателен')
    .isLength({ min: 6 }).withMessage('Новый пароль должен быть не менее 6 символов'),
];

// Валидация ID в параметрах
export const idParamValidation: ValidationChain[] = [
  param('id').isInt().withMessage('ID должен быть числом'),
];

// Валидация пагинации
export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Страница должна быть положительным числом'),
  query('limit')
    .optional()
    .isIn(['10', '25', '50', '100']).withMessage('Лимит должен быть 10, 25, 50 или 100'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Порядок сортировки должен быть asc или desc'),
];