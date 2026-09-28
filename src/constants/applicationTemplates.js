// Поля шапки — общие для всех шаблонов заявлений, заполняются из справочника
export const HEADER_FIELDS = [
  { key: 'company', label: 'Организация' },
  { key: 'directorPositionDat', label: 'Должность руководителя (кому)' },
  { key: 'directorShort', label: 'Руководитель (кому)' },
  { key: 'fromPositionGen', label: 'Ваша должность (от кого)' },
  { key: 'fromNameGen', label: 'ФИО (от кого)' },
  { key: 'fromName', label: 'ФИО для подписи' },
  { key: 'currentDate', label: 'Дата' },
]

// Шаблоны заявлений: файл лежит в public, fields — то, что заполняет сам пользователь
export const APPLICATION_TEMPLATES = [
  {
    id: 'timeoff',
    title: 'Заявление на отгул',
    path: '/timeoff.docx',
    fields: [
      // Только для подстановки в текст, в сам шаблон не попадает
      { key: 'dateFrom', label: 'Дата начала', type: 'date' },
      { key: 'dateTo', label: 'Дата окончания', type: 'date' },
      {
        key: 'textTimeOff',
        label: 'Текст заявления',
        type: 'textarea',
        placeholder: 'Прошу предоставить отгул ...',
      },
    ],
    // Заготовки текста для поля textField; {dateFrom}/{dateTo} — из полей дат
    textField: 'textTimeOff',
    textTemplates: [
      {
        id: 'unpaid-leave',
        text: 'Прошу предоставить мне отпуск без сохранения заработной платы с {dateFrom} по {dateTo}.',
      },
    ],
  },
]
