import { timeTrackApi } from './api'

// Прикрепляет файл (фото/скан чека) к уже созданному чеку. Можно вызывать
// несколько раз — для чека, в отличие от заявки на отпуск, обычно нужно
// больше одного файла (фото + скан, несколько ракурсов). Список файлов —
// getEntityFiles('receipt', id) из files.api.js, удаление — deleteFile.
export const uploadReceiptFile = async (receiptId, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await timeTrackApi.post(
      `/receipts/${receiptId}/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка при загрузке файла чека:', error)
    throw error
  }
}

// Создаёт чек: фронт сам сканирует QR, ходит во внешнее API "Проверка чека
// онлайн" и передаёт сюда уже готовый разобранный ответ + userId сотрудника.
// data: { userId, fiscalDriveNumber, fiscalDocumentNumber, fiscalSign,
//         ticketDate, totalSum, sellerInn, sellerName, operationType,
//         retailPlaceAddress, requestNumber, cashTotalSum, ecashTotalSum,
//         taxationType, nds20, nds10, nds0, ndsNo, rawQr, items: [...] }
export const createReceipt = async (data) => {
  try {
    const response = await timeTrackApi.post('/receipts/create', data)
    return response.data
  } catch (error) {
    console.error('Ошибка создания чека:', error)
    throw error
  }
}

// Список чеков конкретного сотрудника (без позиций — для таблицы/списка).
export const getReceiptsByUser = async (userId) => {
  try {
    const response = await timeTrackApi.get(`/receipts/user/${userId}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении чеков пользователя:', error)
    throw error
  }
}

// Чеки ВСЕХ сотрудников — для бухгалтерии (permission receipts.all:read).
export const getAllReceipts = async () => {
  try {
    const response = await timeTrackApi.get('/receipts/all')

    return response.data
  } catch (error) {
    console.error('Ошибка при получении всех чеков:', error)
    throw error
  }
}

// Карточка отдельного чека с позициями (items).
export const getReceiptById = async (id) => {
  try {
    const response = await timeTrackApi.get(`/receipts/${id}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении чека:', error)
    throw error
  }
}

export const deleteReceipt = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/receipts/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка удаления чека:', error)
    throw error
  }
}

// Передаёт чек другому сотруднику (требует receipts.all:edit — см.
// internal/receipt/route.go). Отдаёт обновлённый чек с новым userId.
export const transferReceipt = async (id, userId) => {
  try {
    const response = await timeTrackApi.put(`/receipts/${id}/transfer`, {
      userId,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка передачи чека:', error)
    throw error
  }
}

// Категория чека проставляется бэком автоматически при создании (локальные
// словари, см. internal/receipt_category) — этот вызов только для ручной
// правки. categoryId: null снимает категорию.
export const setReceiptCategory = async (id, categoryId) => {
  try {
    const response = await timeTrackApi.put(`/receipts/${id}/category`, {
      categoryId,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка изменения категории чека:', error)
    throw error
  }
}

// Задним числом проставляет категорию уже сохранённым чекам без неё (тем же
// алгоритмом, что и при создании). Отдаёт {updated, total}.
export const backfillReceiptCategories = async () => {
  try {
    const response = await timeTrackApi.post('/receipts/backfill-categories')
    return response.data
  } catch (error) {
    console.error('Ошибка при массовой категоризации чеков:', error)
    throw error
  }
}

// Предпросмотр категории ДО сохранения чека (см. ReceiptScan.vue) — та же
// классификация, что и при создании, но без записи в словарь продавцов.
export const previewReceiptCategory = async (sellerInn, items) => {
  try {
    const response = await timeTrackApi.post('/receipt-categories/preview', {
      sellerInn,
      items,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка предпросмотра категории чека:', error)
    throw error
  }
}

// Справочник категорий чеков — читать может любой, добавлять новые
// (is_system=false) только receipts.all:edit.
export const getReceiptCategories = async () => {
  try {
    const response = await timeTrackApi.get('/receipt-categories')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении категорий чеков:', error)
    throw error
  }
}

export const createReceiptCategory = async (name) => {
  try {
    const response = await timeTrackApi.post('/receipt-categories', { name })
    return response.data
  } catch (error) {
    console.error('Ошибка при создании категории:', error)
    throw error
  }
}

// Словарь "ключевое слово -> категория" для автоклассификации по позициям
// чека (см. internal/receipt_category.ClassifyReceipt).
export const getReceiptCategoryKeywords = async () => {
  try {
    const response = await timeTrackApi.get('/receipt-categories/keywords')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении словаря ключевых слов:', error)
    throw error
  }
}

export const createReceiptCategoryKeyword = async (keyword, categoryId) => {
  try {
    const response = await timeTrackApi.post('/receipt-categories/keywords', {
      keyword,
      categoryId,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при добавлении ключевого слова:', error)
    throw error
  }
}
