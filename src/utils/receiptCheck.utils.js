// В самой документации формат ticketDate нигде не уточняется (только
// "Дата", без примера значения) — поэтому парсер разбирает сразу все
// правдоподобные варианты, а не гадает один:
//  1) компактный формат ФФД, как в самом QR-коде (t=20190202T1044,
//     см. раздел 2.5 api_documentation.md) — сервис вполне может отдавать
//     ticketDate в том же виде, в каком разобрал его из QR;
//  2) unix-таймстамп в секундах (числом или строкой из одних цифр);
//  3) обычная дата, которую понимает штатный Date().
// Если реальный формат окажется другим — здесь единственное место, которое
// нужно поправить.
const FFD_COMPACT_DATE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/

export function parseExternalDate(value) {
  if (value == null || value === '') return null

  const str = String(value)

  const ffdMatch = str.match(FFD_COMPACT_DATE)
  if (ffdMatch) {
    const [, yyyy, mm, dd, hh, min, ss] = ffdMatch
    const date = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss ?? 0)
    )
    if (!isNaN(date.getTime())) return date
  }

  if (/^\d+$/.test(str)) {
    // секунды -> миллисекунды; если после *1000 дата получается бредовой
    // (см. проверку isNaN ниже), просто идём дальше к штатному Date()
    const asSeconds = new Date(Number(str) * 1000)
    if (!isNaN(asSeconds.getTime())) return asSeconds
  }

  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

// Приводит data.json ответа внешнего API "Проверка чека онлайн" к телу
// POST /receipts/create нашего бэка (см. internal/receipt/model.go).
// Суммы там уже в копейках — как и у нас, пересчитывать не нужно.
//
// На реальных ответах сервис расходится с api_documentation.md сразу в
// двух местах — дата приходит как dateTime, а не ticketDate, и адрес как
// retailPlaceAddress без опечатки — поэтому ниже проверяем оба варианта
// имени, а не только документированный.
export function mapExternalReceipt(json, rawQr) {
  return {
    // fiscalDriveNumber/fiscalDocumentNumber/fiscalSign/requestNumber/userInn
    // сервис иногда отдаёт числом (а не строкой) — у нас на бэке это string;
    // userInn/kktRegId ещё и приходят с паддингом пробелами — trim().
    fiscalDriveNumber: String(json.fiscalDriveNumber ?? '').trim(),
    fiscalDocumentNumber: String(json.fiscalDocumentNumber ?? '').trim(),
    fiscalSign: String(json.fiscalSign ?? '').trim(),
    ticketDate: parseExternalDate(json.ticketDate ?? json.dateTime),
    totalSum: json.totalSum,
    sellerInn: String(json.userInn ?? '').trim(),
    sellerName: json.retailPlace ?? json.user ?? null,
    operationType: json.operationType,
    retailPlaceAddress:
      String(json.retailPlaceAddress ?? json.retailPlaceAddres ?? '').trim() ||
      null,
    requestNumber:
      json.requestNumber != null ? String(json.requestNumber) : null,
    cashTotalSum: json.cashTotalSum,
    ecashTotalSum: json.ecashTotalSum,
    taxationType: json.taxationType,
    // nds18 — историческое имя поля во внешнем API, по факту это ставка
    // 20% (см. тот же комментарий в 022_add_receipts.sql на бэке)
    nds20: json.nds20 ?? json.nds18 ?? 0,
    nds10: json.nds10 ?? json.nds ?? 0,
    nds0: json.nds0 ?? 0,
    ndsNo: json.ndsNo ?? 0,
    rawQr,
    items: (json.items ?? []).map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      sum: i.sum,
    })),
  }
}
