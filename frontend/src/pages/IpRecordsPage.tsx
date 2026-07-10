import { useState, useCallback, useMemo } from 'react'
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
import { IP_RECORD_COLUMNS } from '../utils/constants'
import * as recordsApi from '../api/records'
import type { IpRecord } from '../types'

export default function IpRecordsPage() {
  const pagination = usePagination()
  const { canCreate, canEdit, canDelete, canImport, canExport } = usePermissions()
  const { addNotification } = useNotification()
  const { user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [exceptionRecord, setExceptionRecord] = useState<IpRecord | null>(null)
  const [activeMse, setActiveMse] = useState<number | null>(null)

  // Фильтр по mse добавляем к запросу
  const extraParams = useMemo(() => {
    const params: Record<string, unknown> = {}
    if (activeMse !== null) {
      params.mse = activeMse
    }
    return params
  }, [activeMse])

  const fetchRecords = useCallback(
    async (params: Record<string, unknown>) => {
      return await recordsApi.getRecordsPaginated({ ...params, ...extraParams })
    },
    [extraParams]
  )

  const { data, total, totalPages, loading, refresh } = useRecords<IpRecord>({
    fetchFn: fetchRecords,
    pagination,
    errorMessage: 'Ошибка загрузки IP записей',
  })

  // Подсчёт количества записей для каждого mse
  const mseCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const record of data) {
      if (record.mses && Array.isArray(record.mses)) {
        for (const m of record.mses) {
          counts[m] = (counts[m] || 0) + 1
        }
      }
    }
    return counts
  }, [data])

  const handleToggleMse = useCallback(
    async (record: IpRecord, mse: number) => {
      try {
        const currentMses = record.mses || []
        const newMses = currentMses.includes(mse)
          ? currentMses.filter((m) => m !== mse)
          : [...currentMses, mse]
        await recordsApi.updateRecord(record.id, { mses: newMses } as Partial<IpRecord>)
        addNotification('success', `МСЭ ${mse} ${currentMses.includes(mse) ? 'убран' : 'добавлен'}`)
        refresh()
      } catch {
        addNotification('error', 'Ошибка при изменении МСЭ')
      }
    },
    [addNotification, refresh]
  )

  const handleEdit = useCallback(
    async (record: IpRecord, key: string, value: string) => {
      try {
        await recordsApi.updateRecord(record.id, { [key]: value } as Partial<IpRecord>)
        addNotification('success', 'Запись обновлена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при обновлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleDelete = useCallback(
    async (record: IpRecord) => {
      if (!window.confirm(`Удалить запись #${record.id}?`)) return
      try {
        await recordsApi.deleteRecord(record.id)
        addNotification('success', 'Запись удалена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при удалении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleOpenException = useCallback((record: IpRecord) => {
    setExceptionRecord(record)
  }, [])

  const handleSaveException = useCallback(
    async (data: { note_out: string; date_out: string; who_out: string }) => {
      if (!exceptionRecord) return
      try {
        await recordsApi.updateRecord(exceptionRecord.id, data as Partial<IpRecord>)
        addNotification('success', 'Исключение сохранено')
        setExceptionRecord(null)
        refresh()
      } catch {
        addNotification('error', 'Ошибка при сохранении исключения')
      }
    },
    [exceptionRecord, addNotification, refresh]
  )

  const handleAddRecord = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await recordsApi.createRecord(data as Partial<IpRecord>)
        addNotification('success', 'Запись добавлена')
        setShowAddModal(false)
        refresh()
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
          await recordsApi.createRecord(record as unknown as Partial<IpRecord>)
        }
        addNotification('success', `Импортировано ${records.length} записей`)
        refresh()
      } catch {
        addNotification('error', 'Ошибка при импорте CSV')
      }
    },
    [addNotification, refresh]
  )

  const isRecordExcluded = useCallback(
    (record: IpRecord) => {
      return !!(record.note_out && record.note_out !== '-' && record.note_out !== '')
    },
    []
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          IP Источники
        </h2>
        <div className="flex items-center gap-2">
          {canImport && <CsvImport onImport={handleCsvImport} />}
          {canExport && <CsvExport data={data as unknown as Record<string, unknown>[]} columns={IP_RECORD_COLUMNS} filename="ip-records.csv" />}
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
        columns={IP_RECORD_COLUMNS}
        filters={pagination.filters}
        globalSearch={pagination.globalSearch}
        onFilterChange={pagination.setFilter}
        onGlobalSearchChange={pagination.setGlobalSearch}
        onClearFilters={pagination.clearFilters}
        total={total}
      />

      <DataTable
        data={data}
        columns={IP_RECORD_COLUMNS}
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
        variant="ip"
        activeMses={activeMse !== null ? [activeMse] : undefined}
        emptyMessage="IP записи не найдены"
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
        columns={IP_RECORD_COLUMNS}
        title="IP запись"
        currentUser={user?.full_name || user?.username || ''}
        variant="ip"
      />

      {exceptionRecord && (
        <ExceptionModal
          isOpen={!!exceptionRecord}
          onClose={() => setExceptionRecord(null)}
          onSave={handleSaveException}
          record={exceptionRecord}
          currentUser={user?.full_name || user?.username || ''}
          variant="ip"
        />
      )}
    </div>
  )
}