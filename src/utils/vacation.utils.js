export const formatStats = (stat) => {
  const lastDigit = stat % 10;
  const lastTwoDigits = stat % 100;

  // Исключаем 11-14 (они всегда с "дней")
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${stat} дней`;
  }

  // 1 день (1, 21, 31, 41...)
  if (lastDigit === 1) {
    return `${stat} день`;
  }

  // 2-4 дня (2, 3, 4, 22, 23, 24...)
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${stat} дня`;
  }

  // 0, 5-9 дней (0, 5, 6, 7, 8, 9, 10, 11-20, 25...)
  return `${stat} дней`;
};

export const formatHours = (hours) => {
  const lastDigit = hours % 10;
  const lastTwoDigits = hours % 100;

  // Исключаем 11–14 (всегда "часов")
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${hours} часов`;
  }

  // 1 час (1, 21, 31, 41...)
  if (lastDigit === 1) {
    return `${hours} час`;
  }

  // 2–4 часа (2, 3, 4, 22, 23, 24...)
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${hours} часа`;
  }

  // 0, 5–9 часов
  return `${hours} часов`;
};
