import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import MaintenanceScreen from './components/MaintenanceScreen.vue'
import router from './router'
import tooltip from './directives/tooltip'

// Поставьте false, чтобы отключить временный экран и вернуть сайт.
const MAINTENANCE_MODE = false

// Обход в текущей вкладке: sessionStorage.setItem('maintenance_bypass', 'true'); location.reload()
const maintenanceActive = MAINTENANCE_MODE && sessionStorage.getItem('maintenance_bypass') !== 'true'

const app = createApp(maintenanceActive ? MaintenanceScreen : App)

app.use(createPinia())
app.use(tooltip)
if (!maintenanceActive) {
  app.use(router)
}

app.mount('#app')
