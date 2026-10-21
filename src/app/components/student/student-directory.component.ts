import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildCsv, downloadCsv } from '../../utils/csv';

interface StudentItem {
  id: number; name: string; age: number; email: string; departmentName?: string; departmentId?: number;
}

@Component({
  selector: 'app-student-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-heading">
      <h2>Students</h2>
      <p>Browse, search, sort, and manage the college student roster. {{ total() ? total() + ' records total.' : '' }}</p>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Roster</h3>
        <div class="toolbar">
          <button class="btn btn-secondary" (click)="exportCsv()" [disabled]="exporting()">
            {{ exporting() ? 'Exporting…' : 'Export CSV' }}
          </button>
          <button class="btn btn-primary" (click)="openAdd()">+ Add student</button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="field">
          <label for="s-search">Search by name</label>
          <input id="s-search" type="search" [(ngModel)]="searchName" (ngModelChange)="onSearchChange()" placeholder="Type a student name…" />
        </div>
        <div class="field">
          <label for="s-dept">Department</label>
          <select id="s-dept" [(ngModel)]="filterDept" (ngModelChange)="applyFilter()">
            <option [value]="null">All departments</option>
            @for (d of departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
          </select>
        </div>
      </div>

      @if (notification()) { <div class="alert alert-success" role="status">{{ notification() }}</div> }
      @if (errorMsg()) { <div class="alert alert-error" role="alert">{{ errorMsg() }}</div> }
      @if (exportError()) { <div class="alert alert-error" role="alert">{{ exportError() }}</div> }
      @if (loading()) {
        <div class="loading" role="status"><span class="spinner" aria-hidden="true"></span> Loading students…</div>
      }
      @else if (students().length === 0) { <p class="state">No students match your filters.</p> }
      @else {
        <div class="table-wrap">
          <table aria-label="Students">
            <thead><tr>
              <th scope="col">Id</th>
              <th scope="col"><button type="button" class="sort-btn" (click)="setSort('name')">Name {{ sortArrow('name') }}</button></th>
              <th scope="col"><button type="button" class="sort-btn" (click)="setSort('age')">Age {{ sortArrow('age') }}</button></th>
              <th scope="col">Email</th>
              <th scope="col">Department</th>
              <th scope="col" class="col-actions">Actions</th>
            </tr></thead>
            <tbody>
              @for (s of students(); track s.id) {
                <tr>
                  <td class="mono">{{ s.id }}</td>
                  <td>
                    <div class="cell-person">
                      <span class="avatar" aria-hidden="true">{{ initials(s.name) }}</span>
                      <span class="strong">{{ s.name }}</span>
                    </div>
                  </td>
                  <td>{{ s.age }}</td>
                  <td class="email">{{ s.email }}</td>
                  <td>
                    @if (s.departmentName) {
                      <span class="pill pill-green">{{ s.departmentName }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td class="col-actions">
                    <div class="row-actions">
                      <button class="btn btn-secondary btn-sm" (click)="openEdit(s)">Edit</button>
                      <button class="btn btn-danger btn-sm" (click)="askDelete(s.id)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <nav class="pager" aria-label="Pagination">
          <button class="btn btn-secondary" (click)="prevPage()" [disabled]="page() <= 1">‹ Prev</button>
          <span>Page {{ page() }} / {{ totalPages() }} · {{ total() }} total</span>
          <button class="btn btn-secondary" (click)="nextPage()" [disabled]="page() * pageSize() >= total()">Next ›</button>
        </nav>
      }
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="cancelForm()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" aria-label="Close" (click)="cancelForm()">&times;</button>
          <h2>{{ editingId() ? 'Edit student' : 'Add student' }}</h2>
          <p class="modal-sub">Fill the form to register or update a student.</p>
          @if (formError()) { <div class="alert alert-error" style="margin-bottom:0.9rem">{{ formError() }}</div> }
          <form (submit)="$event.preventDefault(); save()" class="form-grid">
            <div class="field"><label for="f-name">Name</label><input id="f-name" type="text" [(ngModel)]="formName" name="name" required placeholder="2-100 chars" /></div>
            <div class="field"><label for="f-age">Age</label><input id="f-age" type="number" [(ngModel)]="formAge" name="age" required min="5" max="120" placeholder="5-120" /></div>
            <div class="field"><label for="f-email">Email</label><input id="f-email" type="email" [(ngModel)]="formEmail" name="email" required placeholder="name@example.com" /></div>
            <div class="field"><label for="f-dept">Department</label>
              <select id="f-dept" [(ngModel)]="formDeptId" name="dept">
                @for (d of departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
              </select>
            </div>
          </form>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="cancelForm()">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ editingId() ? 'Save' : 'Create' }}</button>
          </div>
        </div>
      </div>
    }

    @if (confirmDeleteId()) {
      <div class="overlay" (click)="cancelDelete()">
        <div class="dialog-confirm" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h2>Delete student</h2>
          <p>Student <strong>#{{ confirmDeleteId() }}</strong> will be permanently removed.</p>
          <div class="form-actions"><button class="btn btn-ghost" (click)="cancelDelete()">Cancel</button><button class="btn btn-danger" (click)="confirmDelete()">Delete</button></div>
        </div>
      </div>
    }
  `,
})
export class StudentDirectoryComponent implements OnInit {
  private http = inject(HttpClient);
  students = signal<StudentItem[]>([]);
  departments = signal<{ id: number; name: string }[]>([]);
  loading = signal(true); errorMsg = signal(''); notification = signal('');
  searchName = signal(''); filterDept = signal<number | null>(null);
  page = signal(1); pageSize = signal(10); sort = signal('name'); total = signal(0);
  showForm = signal(false); editingId = signal<number | null>(null);
  formName = signal(''); formAge = signal<number | null>(null); formEmail = signal(''); formDeptId = signal(1);
  formError = signal(''); confirmDeleteId = signal<number | null>(null); saving = signal(false); exporting = signal(false); exportError = signal('');

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()) || 1);

  ngOnInit() {
    this.loadData();
    this.http.get<{ id: number; name: string }[]>('https://localhost:7235/api/Departments').subscribe({
      next: (d) => this.departments.set(d || []),
      error: () => this.departments.set([]),
    });
  }

  loadData() {
    this.loading.set(true); this.errorMsg.set('');
    const url = `https://localhost:7235/api/Students?name=${encodeURIComponent(this.searchName())}`
      + `&page=${this.page()}&pageSize=${this.pageSize()}&sort=${encodeURIComponent(this.sort())}`
      + (this.filterDept() ? `&departmentId=${this.filterDept()}` : '');
    this.http.get<{ total: number; data: StudentItem[] }>(url).subscribe({
      next: (res) => { this.students.set(res.data || []); this.total.set(res.total || 0); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMsg.set('Failed to load students.'); },
    });
  }

  sortArrow(field: string) {
    const s = this.sort();
    if (s === field) return '▲'; if (s === '-' + field) return '▼'; return '↕';
  }
  setSort(field: string) {
    const c = this.sort();
    let n = field;
    if (c === field) n = '-' + field;
    else if (c === '-' + field) n = field;
    this.sort.set(n); this.loadData();
  }
  onSearchChange() { this.page.set(1); this.loadData(); }
  applyFilter() { this.page.set(1); this.loadData(); }
  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.loadData(); } }
  nextPage() { if (this.page() * this.pageSize() < this.total()) { this.page.update(p => p + 1); this.loadData(); } }

  /**
   * Downloads every student record as a CSV file.
   *
   * The table is paginated, so this re-queries the API with a large page size
   * rather than exporting only the rows currently on screen.
   */
  exportCsv() {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.exportError.set('');

    this.http.get<{ total: number; data: StudentItem[] }>(
      `https://localhost:7235/api/Students?page=1&pageSize=10000&sort=name`
    ).subscribe({
      next: (res) => {
        const rows = res?.data ?? [];
        if (rows.length === 0) {
          this.exportError.set('There are no students to export.');
          this.exporting.set(false);
          return;
        }
        const csv = buildCsv(rows.map(s => ({
          'Student ID': s.id,
          'Name': s.name,
          'Email': s.email,
          'Age': s.age,
          'Department': s.departmentName ?? ''
        })));
        downloadCsv(csv, 'students.csv');
        this.exporting.set(false);
      },
      error: () => {
        this.exportError.set('Could not export students. Please try again.');
        this.exporting.set(false);
      },
    });
  }

  openAdd() { this.editingId.set(null); this.formName.set(''); this.formAge.set(null); this.formEmail.set(''); this.formDeptId.set(this.departments()[0]?.id || 1); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); this.errorMsg.set(''); this.notification.set(''); }
  openEdit(s: StudentItem) { this.editingId.set(s.id); this.formName.set(s.name); this.formAge.set(s.age); this.formEmail.set(s.email); this.formDeptId.set(s.departmentId || this.departments()[0]?.id || 1); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); }
  cancelForm() { this.showForm.set(false); this.editingId.set(null); this.formError.set(''); }
  askDelete(id: number) { this.confirmDeleteId.set(id); this.showForm.set(false); }
  cancelDelete() { this.confirmDeleteId.set(null); }

  private apiError(err: any, fallback: string): string {
    const b = err?.error;
    if (b?.errors) return Object.entries(b.errors).map(([f, m]) => `${f}: ${(m as string[]).join(' ')}`).join(' · ');
    if (typeof b === 'string' && b.trim()) return b; if (b?.title) return b.title; return fallback;
  }

  save() {
    const name = this.formName(); const age = this.formAge(); const email = this.formEmail();
    if (!name || age == null || !email) { this.formError.set('Please fill name, age, and email.'); return; }
    this.formError.set(''); this.saving.set(true);
    const payload = { name, age, email, departmentId: this.formDeptId() };
    if (this.editingId() !== null) {
      this.http.put(`https://localhost:7235/api/Students/${this.editingId()}`, payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Student updated.'); this.loadData(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Update failed.')); },
      });
    } else {
      this.http.post('https://localhost:7235/api/Students', payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Student created.'); this.loadData(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Could not create student.')); },
      });
    }
  }

  initials(name: string): string {
    return (name || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  confirmDelete() {
    const id = this.confirmDeleteId(); if (id === null) return;
    this.http.delete(`https://localhost:7235/api/Students/${id}`).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.notification.set('Student deleted.'); this.loadData(); },
      error: () => { this.errorMsg.set('Delete failed.'); this.confirmDeleteId.set(null); },
    });
  }
}
