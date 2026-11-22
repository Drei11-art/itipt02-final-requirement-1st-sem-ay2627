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
<<<<<<< HEAD
      import('./pages/admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
=======
      import('./pages/admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage
    ),
>>>>>>> 5a3a901b29435521227c3f92e187e9b4a132cc66
},
  {
    path: 'resident-user',
    loadComponent: () =>
      import('./pages/resident-user/resident-user.page').then(
        (m) => m.ResidentUserPage
      ),
  },
];