// serverPagination.js
// Управление серверной пагинацией для IP записей

import { authFetch } from './api/client.js';
import { CONFIG } from './config.js';

// Состояние пагинации
let state = {
    currentPage: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    sortBy: 'id',
    sortOrder: 'asc',
    filters: {},
    globalSearch: '',
    isLoading: false
};

// Загрузка данных с сервера
export async function loadDataFromServer() {
    if (state.isLoading) return null;
    
    state.isLoading = true;
    
    try {
        // Строим URL с параметрами
        const params = new URLSearchParams({
            page: state.currentPage,
            limit: state.pageSize,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder
        });
        
        // Добавляем фильтры, если есть
        if (Object.keys(state.filters).length > 0) {
            params.append('filters', JSON.stringify(state.filters));
        }
        
        // Добавляем глобальный поиск, если есть
        if (state.globalSearch) {
            params.append('globalSearch', state.globalSearch);
        }
        
        const url = `${CONFIG.API_URL}/records/paginated?${params.toString()}`;
        const response = await authFetch(url);
        
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const result = await response.json();
        
        state.totalRecords = result.total;
        state.totalPages = result.totalPages;
        state.currentPage = result.page;
        
        console.log(`📊 Загружена страница ${state.currentPage} из ${state.totalPages}, всего записей: ${state.totalRecords}`);

        return result.data;
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные');
        return null;
    } finally {
        state.isLoading = false;
    }
}

// Получить текущее состояние
export function getPaginationState() {
    return { ...state };
}

// Установить страницу
export function setCurrentPage(page) {
    state.currentPage = page;
}

// Установить размер страницы
export function setPageSize(size) {
    state.pageSize = size;
    state.currentPage = 1;
}

// Установить сортировку
export function setSort(column, order) {
    state.sortBy = column;
    state.sortOrder = order;
    state.currentPage = 1;
}

// Установить фильтры
export function setFilters(filters) {
    state.filters = { ...filters };
    state.currentPage = 1;
}

// Установить глобальный поиск
export function setGlobalSearch(searchText) {
    state.globalSearch = searchText;
    state.currentPage = 1;
}

// Очистить все фильтры
export function clearAllFilters() {
    state.filters = {};
    state.globalSearch = '';
    state.currentPage = 1;
}

// Получить общее количество страниц
export function getTotalPages() {
    return state.totalPages;
}

// Получить общее количество записей
export function getTotalRecords() {
    return state.totalRecords;
}

// Проверка загрузки
export function isLoading() {
    return state.isLoading;
}