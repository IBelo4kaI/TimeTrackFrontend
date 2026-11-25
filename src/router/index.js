import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import { useUserStore } from '@/stores/user'
import WorkerPage from '@/pages/workers/WorkerPage.vue'
import CalendarPage from '@/pages/calendar/Index.vue'
import ReportPage from '@/pages/report/Index.vue'
import VacationPage from '@/pages/vacation/Vacation.vue'
import VacationCreateStepsPage from '@/pages/vacation/VacationCreateStepsPage.vue'
import DocumentPage from '@/pages/document/Document.vue'
import SettingsPage from '@/pages/settings/Index.vue'
import VacationApplicationPage from '@/pages/document/VacationApplication.vue'
import VacationFileViewerPage from '@/pages/document/VacationFileViewer.vue'
import ChatPage from '@/pages/chat/Index.vue'
import ProfilePage from '@/pages/profile/Index.vue'

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
    },
  },
  calendar: {
    path: '/calendar',
    name: 'calendar',
    component: CalendarPage,
    meta: {
      title: 'Календарь',
      departmentManagerAccess: true,
      icon: 'fa-light fa-calendar',
      entity: 'calendar',
      action: 'read',
    },
  },
  report: {
    path: '/report',
    name: 'report',
    component: ReportPage,
    meta: {
      title: 'Табель',
      departmentManagerAccess: true,
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
      departmentManagerAccess: true,
      icon: 'fa-light fa-tree-palm',
      entity: 'vacation',
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
  chats: {
    path: '/chats',
    name: 'chats',
    component: ChatPage,
    meta: {
      title: 'Чаты',
      icon: 'fa-light fa-comments',
      entity: 'chat',
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
      name: 'calendar',
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
router.addRoute(routesNavigation.docs)
router.addRoute(routesNavigation.chats)
router.addRoute(routesNavigation.settings)

router.addRoute({
  path: '/profile',
  name: 'profile',
  component: ProfilePage,
  meta: { title: 'Личный кабинет' },
})

router.addRoute({
  path: '/vacation/create',
  name: 'vacation-create',
  component: VacationCreateStepsPage,
  meta: { title: 'Создание отпуска', entity: 'vacation', action: 'create' },
})

router.addRoute({
  path: '/docs/vacation/:id',
  name: 'vacation-application',
  component: VacationApplicationPage,
  meta: {
    title: 'Заявление на отпуск',
    entity: 'vacation',
    action: 'read',
    departmentManagerAccess: true,
  },
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

  if (
    !userStore.hasPermission(entity, action) &&
    !(
      to.meta.departmentManagerAccess &&
      userStore.hasPermission('department.manager', 'manage')
    )
  ) {
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

router.afterEach((to, from, failure) => {
  if (failure) return

  // Переиспользуемая страница может регистрировать вкладки только при setup.
  if (
    to.matched.at(-1)?.components?.default !==
    from.matched.at(-1)?.components?.default
  ) {
    useSubmenuStore().reset()
  }
})

export default router
