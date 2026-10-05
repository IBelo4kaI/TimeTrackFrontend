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
