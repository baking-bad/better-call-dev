import Vue from 'vue'
import Router from 'vue-router'

import Landing from './views/Landing.vue'

Vue.use(Router)

export default new Router({
  mode: "history",
  routes: [{
    path: '/',
    name: 'landing',
    component: Landing
  }, {
    path: '/main/:address(KT[0-9A-z]{34})',
    name: 'mainnet',
    component: Dashboard
  }, {
    path: '/alpha/:address(KT[0-9A-z]{34})',
    name: 'alphanet',
    component: Dashboard
  }{
    path: '*',
    name: '404',
    component: () => import( /* webpackChunkName: "404" */ './views/404.vue')
  }]
})
