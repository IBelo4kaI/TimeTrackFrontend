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
      // param: поле показывается, когда выбрана заготовка текста с этим параметром;
      // в сам шаблон не попадает
      { key: 'dateFrom', label: 'Дата начала', type: 'date', param: true },
      { key: 'dateTo', label: 'Дата окончания', type: 'date', param: true },
      {
        key: 'workDate',
        label: 'Дата работы в выходной день',
        type: 'date',
        param: true,
      },
      {
        key: 'textTimeOff',
        label: 'Текст заявления',
        type: 'textarea',
        placeholder: 'Прошу предоставить отгул ...',
      },
    ],
    // Заготовки текста для поля textField; params — какие поля дат нужны заготовке, {key} в тексте — из них
    textField: 'textTimeOff',
    textTemplates: [
      {
        id: 'unpaid-leave',
        params: ['dateFrom', 'dateTo'],
        text: 'Прошу предоставить мне отпуск без сохранения заработной платы с {dateFrom} по {dateTo}.',
      },
      {
        id: 'unpaid-leave-day',
        params: ['dateFrom'],
        text: 'Прошу предоставить мне отпуск без сохранения заработной платы на {dateFrom}.',
      },
      {
        id: 'day-off-for-weekend-work',
        params: ['dateFrom', 'workDate'],
        text: 'Прошу предоставить мне день отдыха {dateFrom} в качестве компенсации за работу в выходной (праздничный) день {workDate}.',
      },
      {
        id: 'time-off-day',
        params: ['dateFrom'],
        text: 'Прошу предоставить мне отгул {dateFrom} с последующей отработкой.',
      },
      {
        id: 'time-off-period',
        params: ['dateFrom', 'dateTo'],
        text: 'Прошу предоставить мне отгул с {dateFrom} по {dateTo} с последующей отработкой.',
      },
    ],
  },
]
