import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OverviewStats, DepartmentCount, EnrollmentPerStudent } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = 'https://localhost:7235/api';

  overview(): Observable<OverviewStats> {
    return this.http.get<OverviewStats>(`${this.base}/Stats/overview`);
  }

  deptBreakdown(): Observable<DepartmentCount[]> {
    return this.http.get<DepartmentCount[]>(`${this.base}/Stats/students-by-department`);
  }

  enrollmentsByStudent(): Observable<EnrollmentPerStudent[]> {
    return this.http.get<EnrollmentPerStudent[]>(`${this.base}/Stats/enrollments-by-student`);
  }

  departmentsWithCounts(): Observable<any> {
    return this.http.get<any>(`${this.base}/Departments`);
  }

  subjectsWithCounts(): Observable<any> {
    return this.http.get<any>(`${this.base}/Subjects`);
  }

  students(): Observable<any> {
    return this.http.get<any>(`${this.base}/Students?pageSize=10000`);
  }
}
