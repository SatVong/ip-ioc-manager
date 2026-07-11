import { useState, useCallback, useMemo, useEffect } from 'react'
import DataTable from '../components/table/DataTable'
import FilterBar from '../components/filters/FilterBar'
import SourceTabs from '../components/filters/SourceTabs'
import Pagination from '../components/pagination/Pagination'
import AddRecordModal from '../components/modal/AddRecordModal'
import ExceptionModal from '../components/modal/ExceptionModal'
import CsvImport from '../components/csv/CsvImport'
import CsvExport from '../components/csv/CsvExport'
import { usePagination } from '../hooks/usePagination'
import { useRecords } from '../hooks/useRecords'
import { usePermissions } from '../hooks/usePermissions'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../hooks/useAuth'
import { WHITE_IP_RECORD_COLUMNS, WHITE_IP_FILTER_KEY_MAP } from '../utils/constants'
import * as whiteIpRecordsApi from '../api/whiteIpRecords'
import type { WhiteIpRecord } from '../types'

export default function WhiteIpRecordsPage() {
  const pagination = usePagination()
  const { canCreate, canEdit, canDelete, canImport, canExport } = usePermissions()
  const { addNotification } = useNotification()
  const { user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [exceptionRecord, setExceptionRecord] = useState<WhiteIpRecord | null>(null)
  const [activeMse, setActiveMse] = useState<number | null>(null)
  const [mseCounts, setMseCounts] = useState<Record<number, number>>({})
  const [mseRefreshCounter, setMseRefreshCounter] = useState(0)

  // Загружаем количество записей для каждого MSE из БД (со всего сервера)
  const loadMseCounts = useCallback(async () => {
    try {
      const counts = await whiteIpRecordsApi.getWhiteIpRecordsMseCounts()
      setMseCounts(counts)
    } catch {
      // Ошибка не критична
    }
  }, [])

  useEffect(() => {
    loadMseCounts()
  }, [loadMseCounts, mseRefreshCounter])

  const extraParams = useMemo(() => {
    const params: Record<string, unknown> = {}
    if (activeMse !== null) {
      params.mse = activeMse
    }
    return params
  }, [activeMse])

  const fetchRecords = useCallback(
    async (params: Record<string, unknown>) => {
      return await whiteIpRecordsApi.getWhiteIpRecordsPaginated({ ...params, ...extraParams })
    },
    [extraParams]
  )

  const { data, total, totalPages, loading, refresh } = useRecords<WhiteIpRecord>({
    fetchFn: fetchRecords,
    pagination,
    errorMessage: 'Ошибка загрузки White IP записей',
    filterKeyMap: WHITE_IP_FILTER_KEY_MAP,
  })

  const handleToggleMse = useCallback(
    async (record: WhiteIpRecord, mse: number) => {
      try {
        const currentMses = record.mses || []
        const newMses = currentMses.includes(mse)
          ? currentMses.filter((m) => m !== mse)
          : [...currentMses, mse]
        await whiteIpRecordsApi.updateWhiteIpRecord(record.id, { mses: newMses } as Partial<WhiteIpRecord>)
        addNotification('success', `МСЭ ${mse} ${currentMses.includes(mse) ? 'убран' : 'добавлен'}`)
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при изменении МСЭ')
      }
    },
    [addNotification, refresh]
  )

  const handleEdit = useCallback(
    async (record: WhiteIpRecord, key: string, value: string) => {
      try {
        await whiteIpRecordsApi.updateWhiteIpRecord(record.id, { [key]: value } as Partial<WhiteIpRecord>)
        addNotification('success', 'Запись обновлена')
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при обновлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleDelete = useCallback(
    async (record: WhiteIpRecord) => {
      if (!window.confirm(`Удалить запись #${record.id}?`)) return
      try {
        await whiteIpRecordsApi.deleteWhiteIpRecord(record.id)
        addNotification('success', 'Запись удалена')
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при удалении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleOpenException = useCallback((record: WhiteIpRecord) => {
    setExceptionRecord(record)
  }, [])

  const handleSaveException = useCallback(
    async (data: { note_out: string; date_out: string; who_out: string }) => {
      if (!exceptionRecord) return
      try {
        await whiteIpRecordsApi.updateWhiteIpRecord(exceptionRecord.id, data as Partial<WhiteIpRecord>)
        addNotification('success', 'Исключение сохранено')
        setExceptionRecord(null)
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при сохранении исключения')
      }
    },
    [exceptionRecord, addNotification, refresh]
  )

  const handleAddRecord = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await whiteIpRecordsApi.createWhiteIpRecord(data as Partial<WhiteIpRecord>)
        addNotification('success', 'Запись добавлена')
        setShowAddModal(false)
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при добавлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleCsvImport = useCallback(
    async (records: Record<string, string>[]) => {
      try {
        for (const record of records) {
          await whiteIpRecordsApi.createWhiteIpRecord(record as unknown as Partial<WhiteIpRecord>)
        }
        addNotification('success', `Импортировано ${records.length} записей`)
        refresh()
        setMseRefreshCounter(c => c + 1)
      } catch {
        addNotification('error', 'Ошибка при импорте CSV')
      }
    },
    [addNotification, refresh]
  )

  const isRecordExcluded = useCallback(
    (record: WhiteIpRecord) => {
      return !!(record.note_out && record.note_out !== '-' && record.note_out !== '')
    },
    []
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Белые IP
        </h2>
        <div className="flex items-center gap-2">
          {canImport && <CsvImport onImport={handleCsvImport} />}
          {canExport && <CsvExport data={data as unknown as Record<string, unknown>[]} columns={WHITE_IP_RECORD_COLUMNS} filename="white-ip-records.csv" />}
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              + Добавить
            </button>
          )}
        </div>
      </div>

      <SourceTabs
        variant="ip"
        activeMse={activeMse}
        onChange={setActiveMse}
        counts={mseCounts}
      />

      <FilterBar
        filters={pagination.filters}
        globalSearch={pagination.globalSearch}
        onGlobalSearchChange={pagination.setGlobalSearch}
        onClearFilters={pagination.clearFilters}
        total={total}
      />

      <DataTable
        data={data}
        columns={WHITE_IP_RECORD_COLUMNS}
        loading={loading}
        sortBy={pagination.sortBy}
        sortOrder={pagination.sortOrder}
        onSort={pagination.toggleSort}
        onToggleMse={handleToggleMse}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenException={handleOpenException}
        isRecordExcluded={isRecordExcluded}
        canEdit={canEdit}
        canDelete={canDelete}
        variant="white-ip"
        activeMses={activeMse !== null ? [activeMse] : undefined}
        emptyMessage="White IP записи не найдены"
        filters={pagination.filters}
        onFilterChange={pagination.setFilter}
      />

      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={total}
        totalPages={totalPages}
        onPageChange={pagination.setPage}
        onLimitChange={pagination.setLimit}
      />

      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddRecord}
        columns={WHITE_IP_RECORD_COLUMNS}
        title="White IP запись"
        currentUser={user?.full_name || user?.username || ''}
        variant="white-ip"
      />

      {exceptionRecord && (
        <ExceptionModal
          isOpen={!!exceptionRecord}
          onClose={() => setExceptionRecord(null)}
          onSave={handleSaveException}
          record={exceptionRecord}
          currentUser={user?.full_name || user?.username || ''}
          variant="white-ip"
        />
      )}
    </div>
  )
}