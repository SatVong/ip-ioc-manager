// serverPaginationIoc.js
// Управление серверной пагинацией для IOC записей

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
export async function loadIocDataFromServer() {
    if (state.isLoading) return null;
    
    state.isLoading = true;
    
    try {
        const params = new URLSearchParams({
            page: state.currentPage,
            limit: state.pageSize,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder
        });
        
        if (Object.keys(state.filters).length > 0) {
            params.append('filters', JSON.stringify(state.filters));
        }
        
        if (state.globalSearch) {
            params.append('globalSearch', state.globalSearch);
        }
        
        const url = `${CONFIG.API_URL}/ioc-records/paginated?${params.toString()}`;
        const response = await authFetch(url);
        
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const result = await response.json();
        
        state.totalRecords = result.total;
        state.totalPages = result.totalPages;
        state.currentPage = result.page;
        
        return result.data;
        
    } catch (error) {
        console.error('Ошибка загрузки IOC данных:', error);
        alert('Не удалось загрузить данные');
        return null;
    } finally {
        state.isLoading = false;
    }
}

export function getIocPaginationState() { return { ...state }; }
export function setIocCurrentPage(page) { state.currentPage = page; }
export function setIocPageSize(size) { state.pageSize = size; state.currentPage = 1; }
export function setIocSort(column, order) { state.sortBy = column; state.sortOrder = order; state.currentPage = 1; }
export function setIocFilters(filters) { state.filters = { ...filters }; state.currentPage = 1; }
export function setIocGlobalSearch(searchText) { state.globalSearch = searchText; state.currentPage = 1; }
export function clearIocAllFilters() { state.filters = {}; state.globalSearch = ''; state.currentPage = 1; }
export function getIocTotalPages() { return state.totalPages; }
export function getIocTotalRecords() { return state.totalRecords; }
export function isIocLoading() { return state.isLoading; }