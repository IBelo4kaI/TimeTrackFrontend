import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import { useUserStore } from '@/stores/user'

export const routesNavigation = {
  calendar: {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/pages/calendar/Index.vue'),
    meta: {
      title: 'Календарь',
      icon: 'fa-light fa-calendar',
      entity: 'calendar',
      action: 'read',
      onMobile: true,
    },
  },
  report: {
    path: '/report',
    name: 'report',
    component: () => import('@/pages/report/Index.vue'),
    meta: {
      title: 'Табель',
      icon: 'fa-light fa-clock',
      entity: 'calendar',
      action: 'read',
    },
  },
  vacation: {
    path: '/vacation',
    name: 'vacation',
    component: () => import('@/pages/vacation/Vacation.vue'),
    meta: {
      title: 'Отпуск',
      icon: 'fa-light fa-tree-palm',
      entity: 'vacation',
      action: 'read',
    },
  },
  sickLeave: {
    path: '/sick-leave',
    name: 'sick-leave',
    component: () => import('@/pages/sick_leave/Index.vue'),
    meta: {
      title: 'Больничные',
      icon: 'fa-light fa-notes-medical',
      entity: 'sick_leaves',
      action: 'read',
    },
  },
  docs: {
    path: '/docs',
    name: 'docs',
    component: () => import('@/pages/document/Document.vue'),
    meta: {
      title: 'Документы',
      icon: 'fa-light fa-files',
      entity: 'docs',
      action: 'read',
    },
  },
  settings: {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/settings/Index.vue'),
    meta: {
      title: 'Настройки',
      icon: 'fa-light fa-gear',
      entity: 'system_settings',
      action: 'read',
    },
  },
}

export const routes = [
  {
    path: '/',
    name: 'home',
    redirect: {
      name: 'calendar',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

router.addRoute(routesNavigation.calendar)
router.addRoute(routesNavigation.report)
router.addRoute(routesNavigation.vacation)
router.addRoute(routesNavigation.sickLeave)
router.addRoute(routesNavigation.docs)
router.addRoute(routesNavigation.settings)

// Страница отдельной заявки на отпуск — не пункт меню, открывается по клику
// из списка заявлений (Document/VacationList.vue), поэтому не в routesNavigation.
// entity/action здесь — только базовая проверка (есть ли вообще доступ к
// отпускам); свой ли это конкретный отпуск или чужой — решает бэк (403,
// см. VacationApplication.vue) — фронт заранее этого знать не может, не
// сходив за данными.
router.addRoute({
  path: '/docs/vacation/:id',
  name: 'vacation-application',
  component: () => import('@/pages/document/VacationApplication.vue'),
  meta: { title: 'Заявление на отпуск', entity: 'vacation', action: 'read' },
})

// Не найденная страница
router.addRoute({
  path: '/:pathMatch(.*)*',
  // component: () => import('@/views/AboutView.vue'),
  meta: { title: '404' },
  redirect: { name: 'home' },
})

// Ждём, пока стор пользователя закончит начальную загрузку (initialFetch()
// в App.vue) — до этого userStore.permissions ещё не заполнен, и проверка
// ниже всегда бы отказывала. App.vue и так не рисует RouterView, пока
// userStore.isLoading — это просто синхронизация роут-гарда с тем же
// состоянием.
function waitForUserReady(userStore) {
  if (!userStore.isLoading) return Promise.resolve()
  return new Promise((resolve) => {
    const unwatch = watch(
      () => userStore.isLoading,
      (loading) => {
        if (!loading) {
          unwatch()
          resolve()
        }
      }
    )
  })
}

// Проверка прав при переходе по ссылке/прямому URL — раньше это делал только
// v-if в NavItem.vue (скрывал пункт в сайдбаре), но сам роут ничего не
// проверял: скрытая из сайдбара страница (например /docs без docs:read)
// всё равно открывалась по прямому переходу.
router.beforeEach(async (to) => {
  const { entity, action } = to.meta
  if (!entity || !action) return true

  const userStore = useUserStore()
  await waitForUserReady(userStore)

  if (!userStore.isLogin) return true // неавторизованных отдельно гейтит App.vue

  if (!userStore.hasPermission(entity, action)) {
    useNotificationStore().addNotification(
      'Недостаточно прав для доступа к этому разделу',
      'error'
    )
    // На calendar не редиректим саму себя — иначе при отсутствии даже
    // calendar:read была бы бесконечная переадресация.
    return to.name === 'calendar' ? true : { name: 'calendar' }
  }

  return true
})

// Глобальный хук для изменения title
router.beforeEach((to, from) => {
  const title = to.meta.title

  if (title) {
    document.title = title
  } else {
    document.title = 'Учет рабочего времени' // Заголовок по умолчанию
  }
})

// Сбрасываем вкладки подменю перед КАЖДОЙ навигацией — до того, как страница
// назначения успеет их выставить. Раньше сброс делался в onUnmounted той
// страницы, с которой уходим, и мог сработать позже, чем setup() страницы,
// на которую переходим (Vue не гарантирует порядок unmount/mount между разными
// компонентами при переходе по роуту) — из-за этого вкладки/контент иногда не
// появлялись. Здесь порядок гарантирован: guard всегда отрабатывает раньше,
// чем создаётся компонент новой страницы, так что её собственный
// submenuStore.setItems()/setActiveTab() в setup() всегда побеждает.
router.beforeEach(() => {
  useSubmenuStore().reset()
})

export default router
