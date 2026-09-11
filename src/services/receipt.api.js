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
