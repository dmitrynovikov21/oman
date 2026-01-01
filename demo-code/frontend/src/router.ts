import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import CasesListPage from './modules/cases/pages/CasesListPage.vue';
import CaseDetailPage from './modules/cases/pages/CaseDetailPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'cases',
    component: CasesListPage,
  },
  {
    path: '/cases/:id',
    name: 'case-detail',
    component: CaseDetailPage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});


