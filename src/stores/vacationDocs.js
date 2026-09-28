import { defineStore } from 'pinia'
import { useVacationStore } from './vacation'
import {
  fillAndDownload,
  findEmployeeByUserId,
  formatDocDate,
} from '@/utils/docs.utils'
import { buildDocumentHeader } from '@/utils/vacation-docs.utils'

export const useVacationDocs = defineStore('vacation-docs', () => {
  const TEMPLATE_PATH = '/vacation.docx'

  const vacationStore = useVacationStore()

  // ─── Основная функция ────────────────────────────────────────────────────

  const getDocument = async (vacationId) => {
    // 1. Находим отпуск по id
    const vacation = vacationStore.vacations.find((v) => v.id === vacationId)
    if (!vacation) throw new Error(`Отпуск ${vacationId} не найден`)

    // 2. Находим сотрудника по user_id из отпуска.
    // Раньше брали из vacationOther.allEmployeesFlat — тот стор грузится
    // только при заходе на вкладку "Отпуска других сотрудников" (см.
    // VacationTable.vue), поэтому при клике на "Получить шаблон заявления"
    // прямо со вкладки "Заявки" (дефолтной) employees там ещё пуст — отсюда
    // и "Сотрудник не найден" для совершенно валидного отпуска. К тому же
    // allEmployeesFlat дополнительно фильтрует список по своему отделу для
    // тех, у кого нет vacation.all:read — это фильтр для UI "кого можно
    // просматривать", он не должен мешать самому себе сгенерировать
    // документ по собственному отпуску. Тянем справочник напрямую, без
    // зависимости от того, открывал ли пользователь другую вкладку.
    const employee = await findEmployeeByUserId(vacation.userId)
    if (!employee)
      throw new Error(`Сотрудник для отпуска ${vacationId} не найден`)

    // 3. Собираем плейсхолдеры
    const header = buildDocumentHeader(employee)

    const data = {
      ...header,
      startDate: formatDocDate(vacation.startDate),
      endDate: formatDocDate(vacation.endDate),
      totalDays: vacation.totalDays,
    }

    // 4. Загружаем шаблон, подставляем, скачиваем
    await fillAndDownload(
      TEMPLATE_PATH,
      data,
      `Заявление — ${employee.full_name}.docx`
    )
  }

  return {
    getDocument,
  }
})
