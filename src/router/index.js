import { createRouter, createWebHistory } from 'vue-router'
import { useSubmenuStore } from '@/stores/submenu'

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
      entity: 'setting',
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
router.addRoute({
  path: '/docs/vacation/:id',
  name: 'vacation-application',
  component: () => import('@/pages/document/VacationApplication.vue'),
  meta: { title: 'Заявление на отпуск' },
})

// Не найденная страница
router.addRoute({
  path: '/:pathMatch(.*)*',
  // component: () => import('@/views/AboutView.vue'),
  meta: { title: '404' },
  redirect: { name: 'home' },
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
