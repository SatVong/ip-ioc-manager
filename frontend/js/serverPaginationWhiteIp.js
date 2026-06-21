// serverPaginationWhiteIp.js
// Управление серверной пагинацией для White IP записей

import { authFetch } from './api/client.js';
import { CONFIG } from './config.js';

// Состояние пагинации
let state = {
    currentPage: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    sortBy: 'id',
    sortOrder: 'desc',
    filters: {},
    globalSearch: '',
    isLoading: false
};

// Загрузка данных с сервера
export async function loadWhiteIpDataFromServer() {
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
        
        const url = `${CONFIG.API_URL}/white-ip-records/paginated?${params.toString()}`;
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
        console.error('Ошибка загрузки White IP данных:', error);
        alert('Не удалось загрузить данные');
        return null;
    } finally {
        state.isLoading = false;
    }
}

export function getWhiteIpPaginationState() { return { ...state }; }
export function setWhiteIpCurrentPage(page) { state.currentPage = page; }
export function setWhiteIpPageSize(size) { state.pageSize = size; state.currentPage = 1; }
export function setWhiteIpSort(column, order) { state.sortBy = column; state.sortOrder = order; state.currentPage = 1; }
export function setWhiteIpFilters(filters) { state.filters = { ...filters }; state.currentPage = 1; }
export function setWhiteIpGlobalSearch(searchText) { state.globalSearch = searchText; state.currentPage = 1; }
export function clearWhiteIpAllFilters() { state.filters = {}; state.globalSearch = ''; state.currentPage = 1; }
export function getWhiteIpTotalPages() { return state.totalPages; }
export function getWhiteIpTotalRecords() { return state.totalRecords; }
export function isWhiteIpLoading() { return state.isLoading; }
