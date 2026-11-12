import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import MaintenanceScreen from './components/MaintenanceScreen.vue'
import router from './router'
import tooltip from './directives/tooltip'

// Поставьте false, чтобы отключить временный экран и вернуть сайт.
const MAINTENANCE_MODE = false

const app = createApp(MAINTENANCE_MODE ? MaintenanceScreen : App)

app.use(createPinia())
app.use(tooltip)
if (!MAINTENANCE_MODE) {
  app.use(router)
}

app.mount('#app')
