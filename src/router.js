import Vue from 'vue'
import Router from 'vue-router'

import Landing from './views/Landing.vue'
import Dashboard from './views/Dashboard.vue'
import Operations from './components/tabs/Operations.vue'
import Script from './components/tabs/Script.vue'
import State from './components/tabs/State.vue'
import Operation from './views/Operation.vue'

Vue.use(Router)

export default new Router({
  mode: "history",
  routes: [{
    path: '/',
    name: 'landing',
    component: Landing
  }, {
    path: '/:network(main|alpha|sandbox)/:address(KT[0-9A-z]{34})',
    name: 'dashboard',
    component: Dashboard,
    children: [{
      path: '',
      redirect: 'operations'
    }, {
      path: 'operations',
      name: 'operations',
      component: Operations
    }, {
      path: 'script',
      name: 'script',
      component: Script
    }, {
      path: 'state',
      name: 'state',
      component: State
    }]
  }, {
    path: '/:network(main|alpha)/:hash(o[0-9A-z]{50})',
    name: 'operation',
    component: Operation
  }, {
    path: '*',
    name: '404',
    component: () => import( './views/FourOFour.vue' )
  }]
})
