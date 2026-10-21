import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StudentDirectoryComponent } from './components/student/student-directory.component';
import { ReportsComponent } from './components/reports/reports.component';
import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'students', component: StudentDirectoryComponent },
      { path: 'departments', loadComponent: () => import('./components/department/department-directory.component').then(m => m.DepartmentDirectoryComponent) },
      { path: 'subjects', loadComponent: () => import('./components/subject/subject-directory.component').then(m => m.SubjectDirectoryComponent) },
      { path: 'reports', component: ReportsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
