import { getStandard, getStandardForYear } from "@/services/reportStandard.api";
import {
  getReportsMonthStats,
  getReportsMonthStatsForYear,
} from "@/services/reportUser.api";
import { getVacationStats } from "@/services/reportVacation.api";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useDashboardStore = defineStore("dashboard", () => {
  // main
  const hoursWork = ref(0);
  const dataChartHoursStandard = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const dataChartHoursWork = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const labelsChart = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];
  const daysWork = ref(0);
  const daysVacation = ref(0);
  const effectivity = ref(0);
  const diffEffectivityPreviousMonth = ref(0);
  const diffHoursWorkPreviousMonth = ref(0);

  // extra
  const hoursStandard = ref(0);
  const hoursWorkPreviousMonth = ref(0);
  const hoursStandardPreviousMonth = ref(0);
  const daysStandard = ref(0);
  const daysVacationStandard = ref(0);

  const date = new Date();

  const isLoading = ref(false);

  const fetchAll = async () => {
    isLoading.value = true;

    const gender = 1;

    const monthStats = await getReportsMonthStats(
      date.getMonth() + 1,
      date.getFullYear()
    );
    hoursWork.value = monthStats.totalHours;
    daysWork.value = monthStats.workDays;

    const monthStandard = await getStandard(
      date.getFullYear(),
      date.getMonth() + 1,
      gender
    );
    hoursStandard.value = monthStandard.hours;
    daysStandard.value = monthStandard.days;

    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1);

    const monthStatsPrevious = await getReportsMonthStats(
      prevMonth.getMonth() + 1,
      prevMonth.getFullYear()
    );
    hoursWorkPreviousMonth.value = monthStatsPrevious.totalHours;

    const monthStandardPrevious = await getStandard(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
      gender
    );
    hoursStandardPreviousMonth.value = monthStandardPrevious.hours;

    effectivity.value = ((hoursWork.value / hoursStandard.value) * 100).toFixed(
      0
    );

    const vacationStats = await getVacationStats(date.getFullYear());

    daysVacation.value = vacationStats.free;
    daysVacationStandard.value = vacationStats.all;

    const monthHoursForYear = await getReportsMonthStatsForYear(
      date.getFullYear()
    );

    monthHoursForYear.forEach((month) => {
      dataChartHoursWork[month.month - 1] = month.hours;
    });

    const monthStandardForYear = await getStandardForYear(date.getFullYear());

    monthStandardForYear.forEach((month) => {
      if (month.genderId == gender)
        dataChartHoursStandard[month.month - 1] = month.hours;
    });

    isLoading.value = false;
  };

  return {
    hoursWork,
    daysWork,
    daysVacation,
    effectivity,
    diffEffectivityPreviousMonth,
    diffHoursWorkPreviousMonth,
    hoursStandard,
    hoursWorkPreviousMonth,
    hoursStandardPreviousMonth,
    daysStandard,
    daysVacationStandard,
    isLoading,
    dataChartHoursStandard,
    dataChartHoursWork,
    labelsChart,

    fetchAll,
  };
});
