import Vue from 'vue'
import Router from 'vue-router'

import Landing from './views/Landing.vue'
import Dashboard from './views/Dashboard.vue'

Vue.use(Router)

export default new Router({
  mode: "history",
  routes: [{
    path: '/',
    name: 'landing',
    component: Landing
  }, {
    path: '/:network(main|alpha)/:address(KT[0-9A-z]{34})',
    name: 'dashboard',
    component: Dashboard
  }]
})
