import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Observable } from 'rxjs';
import { ReportService } from '../../services/report.service';
import { OverviewStats, DepartmentCount, EnrollmentPerStudent } from '../../models/report.model';

interface StudentDept {
  id: number;
  departmentId?: number;
}

interface SubjectStat {
  name: string;
  studentCount: number;
  shareOfTotal: number;
}

interface EnrollmentRow {
  studentId: number;
  enrollmentCount: number;
  shareOfTotal: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section-heading">
      <h2>Reports & Analytics</h2>
      <p>Real statistics for students, departments, subjects, and enrollments.</p>
    </div>

    @if (loading() && !hasData()) {
      <div class="state">Loading reports data…</div>
    }
    @if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
    }

    @if (hasData()) {
      <div class="stats-row">
        <article class="stat-card" title="Total students from records">
          <div class="stat-label">Total Students</div>
          <div class="stat-value">{{ stats().students }}</div>
          <div class="stat-sub">From student records</div>
        </article>
        <article class="stat-card" title="Academic divisions">
          <div class="stat-label">Departments</div>
          <div class="stat-value">{{ stats().departments }}</div>
          <div class="stat-sub">Active departments</div>
        </article>
        <article class="stat-card" title="Courses offered">
          <div class="stat-label">Subjects</div>
          <div class="stat-value">{{ stats().subjects }}</div>
          <div class="stat-sub">Available subjects</div>
        </article>
        <article class="stat-card" title="Student-subject enrollment links">
          <div class="stat-label">Enrollments</div>
          <div class="stat-value">{{ stats().enrollments }}</div>
          <div class="stat-sub">Active enrollments</div>
        </article>
      </div>

      <div class="panel">
      <div class="panel-head"><h3>Department distribution</h3></div>
      @if (deptRows().length === 0) { <p class="state">No department data.</p> }
      @else {
        <div class="bar-list" role="list" aria-label="Department student distribution">
          @for (d of deptRows(); track d.name) {
            <div class="bar-row" role="listitem" aria-label="{{ d.name }}: {{ d.studentCount }} students ({{ d.share }}%)">
              <div class="bar-label">{{ d.name }}</div>
              <div class="bar-track" aria-hidden="true"><div class="bar-fill" [style.width.%]="(d.studentCount / maxDeptStudents() * 100)"></div></div>
              <div class="bar-value">{{ d.studentCount }} <span class="bar-sub">{{ d.share }}%</span></div>
            </div>
          }
        </div>
      }
    </div>

    <div class="panel">
      <div class="panel-head"><h3>Subject popularity</h3></div>
      @if (subjectStats().length === 0) { <p class="state">No subject data.</p> }
      @else {
        <div class="bar-list" role="list" aria-label="Subject popularity">
          @for (s of subjectStats(); track s.name) {
            <div class="bar-row" role="listitem" aria-label="{{ s.name }}: {{ s.studentCount }} enrollments ({{ s.shareOfTotal }}%)">
              <div class="bar-label">{{ s.name }}</div>
              <div class="bar-track" aria-hidden="true"><div class="bar-fill bar-brass" [style.width.%]="(s.studentCount / maxSubjectStudents() * 100)"></div></div>
              <div class="bar-value">{{ s.studentCount }} <span class="bar-sub">{{ s.shareOfTotal }}%</span></div>
            </div>
          }
        </div>
      }
    </div>
      <div class="panel">
        <div class="panel-head"><h3>Department-wise Student Breakdown</h3></div>
        @if (deptRows().length === 0) { <p class="state">No department data available.</p> }
        @else {
          <div class="table-wrap">
            <table aria-label="Department-wise student breakdown">
              <thead><tr><th>Department</th><th>Students</th><th>Share</th><th>Enrollments</th><th>Avg Enrollments/Student</th></tr></thead>
              <tbody>
                @for (d of deptRows(); track d.name) {
                  <tr><td class="strong">{{ d.name }}</td><td>{{ d.studentCount }}</td><td>{{ d.share }}%</td><td>{{ d.enrollments }}</td><td>{{ d.avgEnrollmentsPerStudent | number:'1.2-2' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Enrollment Insights</h3></div>
        @if (enrollmentRows().length === 0) { <p class="state">No enrollment data available.</p> }
        @else {
          <div class="table-wrap">
            <table aria-label="Enrollment per student">
              <thead><tr><th>Student ID</th><th>Enrollments</th><th>Share of Total</th></tr></thead>
              <tbody>
                @for (e of enrollmentRows(); track e.studentId) {
                  <tr><td class="strong">#{{ e.studentId }}</td><td>{{ e.enrollmentCount }}</td><td>{{ e.shareOfTotal }}%</td></tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Correlation Analysis</h3></div>
        @if (topDept(); as top) {
          <p class="state">Department with highest average enrollments per student: <strong>{{ top.name }}</strong> ({{ top.avgEnrollmentsPerStudent | number:'1.2-2' }}).</p>
        } @else { <p class="state">Not enough data to correlate.</p> }
      </div>
    }
  `,
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  private reportService = inject(ReportService);
  stats = signal<OverviewStats>({ students: 0, departments: 0, subjects: 0, enrollments: 0 });
  deptCounts = signal<DepartmentCount[]>([]);
  enrollmentData = signal<EnrollmentPerStudent[]>([]);
  students = signal<StudentDept[]>([]);
  departments = signal<{ id: number; name: string }[]>([]);
  subjects = signal<{ name: string; studentCount: number }[]>([]);
  loading = signal(true);
  error = signal('');

  /** Enrollment rows with each student's share of all enrollments. */
  enrollmentRows = computed<EnrollmentRow[]>(() => {
    const rows = this.enrollmentData();
    const total = rows.reduce((sum, e) => sum + e.enrollmentCount, 0) || 1;
    return rows
      .map(e => ({
        studentId: e.studentId,
        enrollmentCount: e.enrollmentCount,
        shareOfTotal: Number(((e.enrollmentCount / total) * 100).toFixed(2))
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  });

  /** Department rows: student count, share of students, enrollments, avg per student. */
  deptRows = computed(() => {
    const totalStudents = this.stats().students || 1;
    return this.deptCounts().map(d => {
      const enrollments = this.enrollmentForDept(d.department);
      return {
        name: d.department,
        studentCount: d.count,
        share: Number(((d.count / totalStudents) * 100).toFixed(2)),
        enrollments,
        avgEnrollmentsPerStudent: d.count ? enrollments / d.count : 0
      };
    });
  });

  /** Subjects ranked by enrollment, with share of all enrollments. */
  subjectStats = computed<SubjectStat[]>(() => {
    const total = this.enrollmentData().reduce((sum, e) => sum + e.enrollmentCount, 0) || 1;
    return this.subjects()
      .map(s => ({
        name: s.name,
        studentCount: s.studentCount,
        shareOfTotal: Number(((s.studentCount / total) * 100).toFixed(2))
      }))
      .sort((a, b) => b.studentCount - a.studentCount);
  });

  topDept = computed(() => {
    const rows = this.deptRows();
    if (rows.length === 0) return null;
    return rows.reduce((a, b) => (a.avgEnrollmentsPerStudent > b.avgEnrollmentsPerStudent ? a : b));
  });

  maxDeptStudents = computed(() => {
    const rows = this.deptRows();
    return Math.max(...rows.map(r => r.studentCount), 1);
  });
  maxSubjectStudents = computed(() => {
    const rows = this.subjectStats();
    return Math.max(...rows.map(r => r.studentCount), 1);
  });

  hasData() {
    return this.stats().students > 0 || this.deptCounts().length > 0 || this.enrollmentData().length > 0;
  }

  ngOnInit() { this.loadAll(); }

  async loadAll() {
    this.loading.set(true);
    this.error.set('');

    const stats: OverviewStats | undefined = await this.fetch(this.reportService.overview());
    const deptData: DepartmentCount[] | undefined = await this.fetch(this.reportService.deptBreakdown());
    const enrollData: EnrollmentPerStudent[] | undefined = await this.fetch(this.reportService.enrollmentsByStudent());
    const deptList: any = await this.fetch<any>(this.reportService.departmentsWithCounts());
    const subjectList: any = await this.fetch<any>(this.reportService.subjectsWithCounts());
    const studentList: any = await this.fetch<any>(this.reportService.students());

    if (stats) this.stats.set(stats);
    if (deptData) this.deptCounts.set(deptData);
    if (enrollData) this.enrollmentData.set(enrollData);
    if (deptList) this.departments.set(deptList);
    if (subjectList) this.subjects.set(subjectList);
    if (studentList?.data) this.students.set(studentList.data.map((s: any) => ({ id: s.id, departmentId: s.departmentId })));

    if (!stats && !deptData && !enrollData) {
      this.error.set('Could not reach the reports API. Check that the backend is running.');
    }
    this.loading.set(false);
  }

  /** Resolves to undefined when the request fails, so one bad endpoint does not blank the page. */
  private async fetch<T>(obs: any): Promise<T | undefined> {
    try {
      return await firstValueFrom(obs);
    } catch {
      return undefined;
    }
  }

  private enrollmentForDept(deptName: string): number {
    const dept = this.departments().find(dp => dp.name === deptName);
    if (!dept) return 0;
    return this.enrollmentData().reduce((sum, e) => {
      const student = this.students().find(s => s.id === e.studentId);
      return student?.departmentId === dept.id ? sum + e.enrollmentCount : sum;
    }, 0);
  }
}
