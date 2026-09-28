import { HEADER_FIELDS } from '@/constants/applicationTemplates'
import { useUserStore } from '@/stores/user'
import { fillAndDownload, findEmployeeByUserId } from '@/utils/docs.utils'
import { buildDocumentHeader } from '@/utils/vacation-docs.utils'
import { defineStore } from 'pinia'

export const useApplicationTemplates = defineStore(
  'application-templates',
  () => {
    const userStore = useUserStore()

    // Значения полей шаблона: шапку заполняем из справочника, остальное — пусто
    const buildValues = async (template) => {
      const values = {}
      HEADER_FIELDS.forEach((f) => (values[f.key] = ''))
      template.fields.forEach((f) => (values[f.key] = f.value ?? ''))

      const employee = await findEmployeeByUserId(userStore.user?.id)
      if (!employee) return { values, employeeFound: false }

      Object.assign(values, buildDocumentHeader(employee))
      return { values, employeeFound: true, fileName: employee.full_name }
    }

    const generate = (template, values, fileName = '') =>
      fillAndDownload(
        template.path,
        values,
        `${template.title}${fileName ? ` — ${fileName}` : ''}.docx`
      )

    return { buildValues, generate }
  }
)
