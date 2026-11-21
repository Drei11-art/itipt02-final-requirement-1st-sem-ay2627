import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage
    ),
},
  {
    path: 'resident-user',
    loadComponent: () =>
      import('./pages/resident-user/resident-user.page').then(
        (m) => m.ResidentUserPage
      ),
  },
];