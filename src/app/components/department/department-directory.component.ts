import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface DepartmentItem {
  id: number; name: string; studentCount?: number;
}

@Component({
  selector: 'app-department-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-heading">
      <h2>Departments</h2>
      <p>Manage academic divisions and their student counts.</p>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Departments</h3>
        <div class="toolbar">
          <button class="btn btn-primary" (click)="openAdd()">+ Add department</button>
        </div>
      </div>

      @if (notification()) { <div class="alert alert-success" role="status">{{ notification() }}</div> }
      @if (errorMsg()) { <div class="alert alert-error" role="alert">{{ errorMsg() }}</div> }
      @if (loading()) { <p class="state">Loading departments…</p> }
      @else if (departments().length === 0) { <p class="state">No departments found.</p> }
      @else {
        <div class="dept-grid" aria-label="Department cards">
          @for (d of departments(); track d.id) {
            <article class="dept-card" aria-label="{{ d.name }} department">
              <div class="dept-card-head">
                <h4>{{ d.name }}</h4>
                <span class="mono">#{{ d.id }}</span>
              </div>
              <div class="dept-card-body">
                <span class="stat-value">{{ d.studentCount || 0 }}</span>
                <span class="stat-label">Students</span>
              </div>
              <div class="dept-card-actions">
                <button class="btn btn-secondary btn-sm" (click)="openEdit(d)">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="askDelete(d.id)">Delete</button>
              </div>
            </article>
          }
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="cancelForm()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" aria-label="Close" (click)="cancelForm()">&times;</button>
          <h2>{{ editingId() ? 'Edit department' : 'Add department' }}</h2>
          <p class="modal-sub">Fill the form to register or update a department.</p>
          @if (formError()) { <div class="alert alert-error" style="margin-bottom:0.9rem">{{ formError() }}</div> }
          <form (submit)="$event.preventDefault(); save()" class="form-grid">
            <div class="field"><label for="d-name">Name</label><input id="d-name" type="text" [(ngModel)]="formName" name="name" required placeholder="2-100 characters" /></div>
          </form>
          <div class="modal-actions">
            <button class="btn btn-ghost" (click)="cancelForm()">Cancel</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ editingId() ? 'Save' : 'Create' }}</button>
          </div>
        </div>
      </div>
    }

    @if (confirmDeleteId() !== null) {
      <div class="overlay" (click)="cancelDelete()">
        <div class="dialog-confirm" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h2>Delete department</h2>
          <p>Department <strong>#{{ confirmDeleteId() }}</strong> will be permanently removed.</p>
          @if (deleteError()) { <div class="alert alert-error" style="margin-bottom:0.9rem">{{ deleteError() }}</div> }
          <div class="form-actions"><button class="btn btn-ghost" (click)="cancelDelete()">Cancel</button><button class="btn btn-danger" (click)="confirmDelete()">Delete</button></div>
        </div>
      </div>
    }
  `,
})
export class DepartmentDirectoryComponent implements OnInit {
  private http = inject(HttpClient);
  departments = signal<DepartmentItem[]>([]);
  loading = signal(true);
  errorMsg = signal('');
  notification = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formName = signal('');
  formError = signal('');
  confirmDeleteId = signal<number | null>(null);
  deleteError = signal('');
  saving = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true); this.errorMsg.set(''); this.notification.set('');
    this.http.get<DepartmentItem[]>('https://localhost:7235/api/Departments').subscribe({
      next: (res) => { this.departments.set(res || []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMsg.set('Failed to load departments.'); },
    });
  }

  openAdd() { this.editingId.set(null); this.formName.set(''); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); this.errorMsg.set(''); this.notification.set(''); }
  openEdit(d: DepartmentItem) { this.editingId.set(d.id); this.formName.set(d.name); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); }
  cancelForm() { this.showForm.set(false); this.editingId.set(null); this.formError.set(''); }

  askDelete(id: number) { this.confirmDeleteId.set(id); this.showForm.set(false); this.deleteError.set(''); }
  cancelDelete() { this.confirmDeleteId.set(null); this.deleteError.set(''); }

  private apiError(err: any, fallback: string): string {
    const b = err?.error;
    if (b?.errors) return Object.entries(b.errors).map(([f, m]) => `${f}: ${(m as string[]).join(' ')}`).join(' · ');
    if (typeof b === 'string' && b.trim()) return b;
    if (b?.title) return b.title;
    return fallback;
  }

  save() {
    const name = this.formName();
    if (!name || name.length < 2) { this.formError.set('Name must be 2-100 characters.'); return; }
    this.formError.set(''); this.saving.set(true);
    const payload = { name };
    if (this.editingId() !== null) {
      this.http.put(`https://localhost:7235/api/Departments/${this.editingId()}`, payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Department updated.'); this.loadData(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Update failed.')); },
      });
    } else {
      this.http.post('https://localhost:7235/api/Departments', payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Department created.'); this.loadData(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Could not create department.')); },
      });
    }
  }

  confirmDelete() {
    const id = this.confirmDeleteId(); if (id === null) return;
    this.http.delete(`https://localhost:7235/api/Departments/${id}`).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.deleteError.set(''); this.notification.set('Department deleted.'); this.loadData(); },
      error: (err) => {
        this.deleteError.set(this.apiError(err, 'Delete failed. Department may have linked students.'));
        this.confirmDeleteId.set(null);
      },
    });
  }
}
