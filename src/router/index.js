import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import { useUserStore } from '@/stores/user'
import WorkerPage from '@/pages/workers/WorkerPage.vue'
import CalendarPage from '@/pages/calendar/Index.vue'
import ReportPage from '@/pages/report/Index.vue'
import VacationPage from '@/pages/vacation/Vacation.vue'
import SickLeavePage from '@/pages/sick_leave/Index.vue'
import DocumentPage from '@/pages/document/Document.vue'
import SettingsPage from '@/pages/settings/Index.vue'
import VacationApplicationPage from '@/pages/document/VacationApplication.vue'
import VacationFileViewerPage from '@/pages/document/VacationFileViewer.vue'

export const routesNavigation = {
  dashboard: {
    path: '/home',
    name: 'dashboard',
    component: WorkerPage,
    meta: {
      title: 'Главная',
      icon: 'fa-light fa-house',
      entity: 'calendar',
      action: 'read',
      onMobile: true,
    },
  },
  calendar: {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage,
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
    component: ReportPage,
    meta: {
      title: 'Табель',
      icon: 'fa-light fa-clock',
      entity: 'calendar.all',
      action: 'read',
    },
  },
  vacation: {
    path: '/vacation',
    name: 'vacation',
    component: VacationPage,
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
    component: SickLeavePage,
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
    component: DocumentPage,
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
    component: SettingsPage,
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
      name: 'dashboard',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

router.addRoute(routesNavigation.dashboard)
router.addRoute(routesNavigation.calendar)
router.addRoute(routesNavigation.report)
router.addRoute(routesNavigation.vacation)
router.addRoute(routesNavigation.sickLeave)
router.addRoute(routesNavigation.docs)
router.addRoute(routesNavigation.settings)

router.addRoute({
  path: '/docs/vacation/:id',
  name: 'vacation-application',
  component: VacationApplicationPage,
  meta: { title: 'Заявление на отпуск', entity: 'vacation', action: 'read' },
})

router.addRoute({
  path: '/docs/vacation/:id/file',
  name: 'vacation-file-viewer',
  component: VacationFileViewerPage,
  meta: {
    title: 'Просмотр файла',
    entity: 'vacation',
    action: 'read',
    layout: 'full',
  },
})

router.addRoute({
  path: '/workers/:id',
  name: 'worker',
  component: WorkerPage,
  meta: {
    title: 'Карточка сотрудника',
    entity: 'calendar.all',
    action: 'read',
  },
})

// Не найденная страница
router.addRoute({
  path: '/:pathMatch(.*)*',
  meta: { title: '404' },
  redirect: { name: 'home' },
})

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

router.beforeEach(() => {
  useSubmenuStore().reset()
})

export default router
