import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DemoView from '../views/DemoView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/demo', name: 'demo', component: DemoView },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
