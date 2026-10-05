import { getInternalEmployees } from '@/services/reference.api'
import { flattenInternalEmployees } from '@/utils/user.utils'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

// Сотрудник из справочника по user_id (напрямую, не через сторы вкладок)
export const findEmployeeByUserId = async (userId) => {
  const directory = await getInternalEmployees()
  return flattenInternalEmployees(directory).find((e) => e.user_id === userId)
}

// "2026-03-01" или Date -> "01.03.2026"
export const formatDocDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('.')
}

// Подставляет data в docx-шаблон из public и открывает результат
export const fillAndDownload = async (templatePath, data, filename) => {
  const response = await fetch(templatePath)
  if (!response.ok) {
    throw new Error(
      `Шаблон не найден: ${templatePath} (HTTP ${response.status})`
    )
  }

  const zip = new PizZip(await response.arrayBuffer())
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })

  doc.render(data)

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  downloadBlob(blob, filename)
}

// Открывает результат в новой вкладке; если браузер блокирует окно (вызов
// идёт после асинхронной загрузки шаблона) — скачивает файл
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const opened = window.open(url, '_blank')

  if (!opened) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
