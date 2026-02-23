import { SERVICE_PREFIX } from '@/constants/api.constants'
import { getAllUsers, getMe, getMePermissions } from '@/services/users.api'
import { parseDate } from '@/utils/date.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const permissions = ref(null)
  const usersAll = ref([])
  const isExistUserAll = ref()
  const isLoading = shallowRef(false)
  const isLogin = shallowRef(false)

  const initialFetch = async () => {
    isLoading.value = true
    await userFetch()
    await permissionsFetch()
    isLoading.value = false
  }

  const userFetch = async (changeLoading = false) => {
    if (changeLoading) isLoading.value = true

    const userData = await getMe()

    if (userData) {
      user.value = userData
      isLogin.value = true
      if (changeLoading) isLoading.value = true
    }
  }

  const permissionsFetch = async (changeLoading = false) => {
    if (changeLoading) isLoading.value = true
    const permissionsData = await getMePermissions()

    if (permissionsData) {
      permissions.value = permissionsData.map((p) => p.code)
    }
    if (changeLoading) isLoading.value = false
  }

  const userAllFetch = async (changeLoading = false) => {
    if (changeLoading) isLoading.value = true

    if (hasPermission('users', 'read_all')) {
      const usersData = await getAllUsers()
      if (usersData) {
        usersAll.value = usersData
        isExistUserAll.value = true
      }
    }

    if (changeLoading) isLoading.value = false
  }

  const hasPermission = (entity, action, service = SERVICE_PREFIX) => {
    // Формируем возможные паттерны разрешений
    const permissionPatterns = [
      `${service}:${entity}:${action}`, // точное совпадение
      `${service}:${entity}:all`, // все действия над entity в service
      `${service}:all:${action}`, // action для всех сущностей в service
      `${service}:all:all`, // все действия во всех сущностях service
      `all:${entity}:${action}`, // action entity во всех сервисах
      `all:${entity}:all`, // все действия над entity везде
      `all:all:${action}`, // action везде
      'all:all:all', // полный доступ
    ]

    // Проверяем наличие хотя бы одного паттерна в массиве разрешений
    return permissionPatterns.some((pattern) =>
      permissions.value.includes(pattern)
    )
  }

  const birthdaysByMonthAndDate = (month, date) => {
    return birthdays.value.filter(
      (u) =>
        parseDate(u.birthday).getMonth() == month &&
        parseDate(u.birthday).getDate() == date
    )
  }

  const birthdays = computed(() => {
    if (usersAll.value)
      return usersAll.value.map((u) => {
        return {
          fullName: u.surname + ' ' + u.name,
          initials: [u.surname.charAt(0), u.name.charAt(0)].join(''),
          birthday: u.birthday,
        }
      })
    else return []
  })

  return {
    user,
    permissions,
    usersAll,
    isLoading,
    isLogin,
    isExistUserAll,
    initialFetch,
    permissionsFetch,
    userFetch,
    userAllFetch,
    hasPermission,
    birthdaysByMonthAndDate,
    birthdays,
  }
})
