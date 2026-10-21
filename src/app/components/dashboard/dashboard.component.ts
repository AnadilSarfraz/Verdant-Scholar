import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);

  stats = signal({ students: 0, departments: 0, subjects: 0, enrollments: 0 });
  deptStats = signal<{ department: string; count: number }[]>([]);

  maxDeptCount = signal(1);
  avgEnrollmentsPerStudent = computed(() => {
    const s = this.stats();
    return s.students ? (s.enrollments / s.students).toFixed(1) : '0.0';
  });

  /** Departments ranked by student count (highest first) for the distribution bars. */
  rankedDepts = computed(() => [...this.deptStats()].sort((a, b) => b.count - a.count));

  /** Bar width as a percentage of the largest department; 0 when there is no data. */
  barWidth(count: number): number {
    const max = this.maxDeptCount();
    return max > 0 ? (count / max) * 100 : 0;
  }

  ngOnInit() {
    this.http.get<{ students: number; departments: number; subjects: number; enrollments: number }>(
      'https://localhost:7235/api/Stats/overview'
    ).subscribe({
      next: (s) => this.stats.set(s),
      error: () => this.stats.set({ students: 0, departments: 0, subjects: 0, enrollments: 0 }),
    });
    this.http.get<{ department: string; count: number }[]>(
      'https://localhost:7235/api/Stats/students-by-department'
    ).subscribe({
      next: (a) => {
        const arr = a || [];
        this.deptStats.set(arr);
        const max = Math.max(...arr.map(x => x.count), 1);
        this.maxDeptCount.set(max);
      },
      error: () => { this.deptStats.set([]); this.maxDeptCount.set(1); },
    });
  }
}
