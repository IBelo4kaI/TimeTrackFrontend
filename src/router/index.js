import { createRouter, createWebHistory } from 'vue-router'

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
    },
  },
  report: {
    path: '/report',
    name: 'report',
    component: () => import('@/pages/report/Index.vue'),
    meta: {
      title: 'Табель',
      icon: 'fa-light fa-clock',
      entity: 'report',
      action: 'read',
    },
  },
  vacation: {
    path: '/vacation',
    name: 'vacation',
    component: () => import('@/pages/vacation/Index.vue'),
    meta: {
      title: 'Отпуск',
      icon: 'fa-light fa-tree-palm',
      entity: 'vacation',
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
router.addRoute(routesNavigation.settings)
router.addRoute(routesNavigation.vacation)

// Не найденная страница
router.addRoute({
  path: '/:pathMatch(.*)*',
  component: () => import('@/views/AboutView.vue'),
  meta: { title: '404' },
})

// Глобальный хук для изменения title
router.beforeEach((to, from) => {
  const title = to.meta.title

  if (title) {
    document.title = title
  } else {
    document.title = 'Учет рабочего времени' // Заголовок по умолчанию
  }

  if (to.name == routesNavigation.calendar.name) {
    console.warn('Реализовать')
  }
  if (to.name == routesNavigation.report.name) {
    console.warn('Реализовать')
  }
  if (to.name == routesNavigation.settings.name) {
    console.warn('Реализовать')
  }
  if (to.name == routesNavigation.vacation.name) {
    console.warn('Реализовать')
  }
})

export default router
