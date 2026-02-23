export const required =
  (msg = "Поле обязательно") =>
  (v) =>
    v === null || v === undefined || v === "" ? msg : null;

export const minLength = (len, msg) => (v) =>
  v && v.length < len ? msg || `Минимум ${len} символов` : null;

export const email =
  (msg = "Некорректный email") =>
  (v) =>
    v && !/.+@.+\..+/.test(v) ? msg : null;

export const numberMin = (min, msg) => (v) =>
  v < min ? msg || `Минимум ${min}` : null;

export const startDateBeforeEnd = (startField, endField, message) => {
  return (_, formData) => {
    const start = formData[startField];
    const end = formData[endField];

    if (!start || !end) return null;

    return new Date(start) > new Date(end)
      ? message || "Дата начала не может быть больше даты окончания"
      : null;
  };
};

export const existsFreeVacation = (vacationStore) => (_, data) => {
  if (!data.startDate || !data.endDate) return null;

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  vacationStore.selectedYear = start.getFullYear();

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (vacationStore.loading) {
    console.log("загрузка");
  }

  // Вычисляем разницу в миллисекундах
  const diffInMs = end.getTime() - start.getTime();

  // Конвертируем миллисекунды в дни (1000 мс * 60 сек * 60 мин * 24 часа)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  const days = Math.abs(Math.round(diffInDays) + 1);

  return vacationStore.vacationStats.free < days
    ? `Не хватает свободных отпускных дней: ${days} / ${vacationStore.vacationStats.free}`
    : null;
};
