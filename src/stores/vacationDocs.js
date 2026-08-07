import { defineStore } from 'pinia'
import { useVacationOther } from './vacationOther'
import { useVacationStore } from './vacation'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { buildDocumentHeader } from '@/utils/vacation-docs.utils'

export const useVacationDocs = defineStore('vacation-docs', () => {
  const TEMPLATE_PATH = '/vacation.docx'

  const vacationOther = useVacationOther()
  const vacationStore = useVacationStore()

  // ─── Основная функция ────────────────────────────────────────────────────

  const getDocument = async (vacationId) => {
    // 1. Находим отпуск по id
    const vacation = vacationStore.vacations.find((v) => v.id === vacationId)
    if (!vacation) throw new Error(`Отпуск ${vacationId} не найден`)

    // 2. Находим сотрудника по user_id из отпуска
    const employee = vacationOther.allEmployeesFlat.find(
      (e) => e.user_id === vacation.userId
    )
    if (!employee)
      throw new Error(`Сотрудник для отпуска ${vacationId} не найден`)

    // 3. Собираем плейсхолдеры
    const header = buildDocumentHeader(employee)

    const data = {
      ...header,
      startDate: formatDate(vacation.startDate),
      endDate: formatDate(vacation.endDate),
      totalDays: vacation.totalDays,
    }

    // 4. Загружаем шаблон, подставляем, скачиваем
    await fillAndDownload(data, `Заявление — ${employee.full_name}.docx`)
  }

  // ─── Утилиты ─────────────────────────────────────────────────────────────

  async function fillAndDownload(data, filename) {
    const response = await fetch(TEMPLATE_PATH)
    if (!response.ok) {
      throw new Error(
        `Шаблон не найден: ${TEMPLATE_PATH} (HTTP ${response.status})`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const zip = new PizZip(arrayBuffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    doc.render(data)

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    downloadBlob(blob, filename)
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    // a.href = url
    // a.download = name
    // a.click()
    // URL.revokeObjectURL(url)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    // Принимает "2026-03-01" или Date
    const d = new Date(dateStr)
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear(),
    ].join('.')
  }

  return {
    getDocument,
  }
})
