// pagination/whiteIpPagination.js
// Реэкспорт серверной пагинации для White IP

export {
    getWhiteIpPaginationState,
    setWhiteIpCurrentPage,
    setWhiteIpPageSize,
    setWhiteIpSort,
    setWhiteIpFilters,
    setWhiteIpGlobalSearch,
    clearWhiteIpAllFilters,
    getWhiteIpTotalPages,
    getWhiteIpTotalRecords
} from '../serverPaginationWhiteIp.js';