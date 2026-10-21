import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SubjectItem {
  id: number; name: string; studentCount?: number;
}

interface StudentItem {
  id: number; name: string; age: number; email: string; departmentName?: string;
}

interface EnrollmentItem {
  studentId: number; subjectId: number; studentName?: string; subjectName?: string;
}

const API = 'https://localhost:7235/api';

@Component({
  selector: 'app-subject-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="section-heading">
      <h2>Subjects</h2>
      <p>Manage course offerings, student enrollments, and rosters.</p>
    </div>

    @if (notification()) { <div class="alert alert-success" role="status">{{ notification() }}</div> }
    @if (errorMsg()) { <div class="alert alert-error" role="alert">{{ errorMsg() }}</div> }

    <div class="panel">
      <div class="panel-head">
        <h3>Subjects</h3>
        <div class="toolbar">
          <button class="btn btn-primary" (click)="openAdd()">+ Add subject</button>
        </div>
      </div>

      @if (loadingSubjects()) { <p class="state">Loading subjects…</p> }
      @else if (subjects().length === 0) { <p class="state">No subjects found.</p> }
      @else {
        <div class="subjects-grid" aria-label="Course subjects">
          @for (s of subjects(); track s.id) {
            <article class="subject-card" aria-label="{{ s.name }}">
              <div class="subject-card-head">
                <h4>{{ s.name }}</h4>
                <span class="mono">#{{ s.id }}</span>
              </div>
              <div class="subject-card-stats">
                <span class="stat-value">{{ s.studentCount || 0 }}</span>
                <span class="stat-label">Enrolled</span>
              </div>
              <div class="subject-card-actions">
                <button class="btn btn-secondary btn-sm" (click)="openEdit(s)">Edit</button>
                <button class="btn btn-secondary btn-sm" (click)="viewStudents(s)">Roster</button>
                <button class="btn btn-danger btn-sm" (click)="askDelete(s.id)">Delete</button>
              </div>
            </article>
          }
        </div>
      }
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>New Enrollment</h3>
        <span class="pill pill-teal" aria-label="Enrollment section">Select student and subject</span>
      </div>
      <form class="form-grid" (submit)="$event.preventDefault(); enroll()">
        <div class="field">
          <label for="en-student">Student</label>
          <select id="en-student" [(ngModel)]="enrollStudentId" name="student" [disabled]="enrolling()">
            <option [ngValue]="null">Select a student…</option>
            @for (st of students(); track st.id) { <option [ngValue]="st.id">{{ st.name }} (#{{ st.id }})</option> }
          </select>
        </div>
        <div class="field">
          <label for="en-subject">Subject</label>
          <select id="en-subject" [(ngModel)]="enrollSubjectId" name="subject" [disabled]="enrolling()">
            <option [ngValue]="null">Select a subject…</option>
            @for (sb of subjects(); track sb.id) { <option [ngValue]="sb.id">{{ sb.name }} (#{{ sb.id }})</option> }
          </select>
        </div>
        <div class="field field-action">
          <button class="btn btn-primary" type="submit" [disabled]="enrolling() || !canEnroll()">
            {{ enrolling() ? 'Enrolling…' : 'Enroll student' }}
          </button>
        </div>
      </form>
      @if (enrollError()) { <div class="alert alert-error" role="alert" style="margin-top:1rem">{{ enrollError() }}</div> }
      @if (loadingStudents() && students().length === 0) { <p class="state">Loading students…</p> }
    </div>

    <div class="panel">
      <div class="panel-head">
        <h3>Enrollments</h3>
        <div class="toolbar">
          <label>Student
            <select [ngModel]="enrollmentsForStudentId()" (ngModelChange)="enrollmentsForStudentId.set($event)" name="filterStudent">
              <option [ngValue]="null">All students</option>
              @for (st of students(); track st.id) { <option [ngValue]="st.id">{{ st.name }} (#{{ st.id }})</option> }
            </select>
          </label>
        </div>
      </div>

      @if (loadingEnrollments()) { <p class="state">Loading enrollments…</p> }
      @else if (visibleEnrollments().length === 0) { <p class="state">No enrollments to show.</p> }
      @else {
        <div class="table-wrap">
          <table aria-label="Enrollments">
            <thead><tr><th>Student</th><th>Subject</th><th>Actions</th></tr></thead>
            <tbody>
              @for (e of visibleEnrollments(); track e.studentId + '-' + e.subjectId) {
                <tr>
                  <td class="strong">{{ e.studentName }} (#{{ e.studentId }})</td>
                  <td>{{ e.subjectName }} (#{{ e.subjectId }})</td>
                  <td><button class="btn btn-danger btn-sm" (click)="unenroll(e)">Remove</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="cancelForm()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" aria-label="Close" (click)="cancelForm()">&times;</button>
          <h2>{{ editingId() ? 'Edit subject' : 'Add subject' }}</h2>
          <p class="modal-sub">Fill the form to register or update a subject.</p>
          @if (formError()) { <div class="alert alert-error" role="alert" style="margin-bottom:0.9rem">{{ formError() }}</div> }
          <form (submit)="$event.preventDefault(); save()" class="form-grid">
            <div class="field"><label for="s-name">Name</label><input id="s-name" type="text" [(ngModel)]="formName" name="name" required placeholder="2-100 characters" /></div>
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
          <h2>Delete subject</h2>
          <p>Subject <strong>#{{ confirmDeleteId() }}</strong> will be permanently removed.</p>
          @if (deleteError()) { <div class="alert alert-error" role="alert" style="margin-bottom:0.9rem">{{ deleteError() }}</div> }
          <div class="form-actions">
            <button class="btn btn-ghost" (click)="cancelDelete()">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">Delete</button>
          </div>
        </div>
      </div>
    }

    @if (rosterSubjectId() !== null) {
      <div class="overlay" (click)="closeRoster()">
        <div class="modal" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" aria-label="Close" (click)="closeRoster()">&times;</button>
          <h2>Students in this subject</h2>
          <p class="modal-sub">{{ rosterSubjectName() }}</p>
          @if (loadingRoster()) { <p class="state">Loading students…</p> }
          @else if (roster().length === 0) { <p class="state">No students are enrolled in this subject.</p> }
          @else {
            <div class="table-wrap">
              <table aria-label="Students in subject">
                <thead><tr><th>Id</th><th>Name</th><th>Email</th></tr></thead>
                <tbody>
                  @for (st of roster(); track st.id) {
                    <tr><td class="mono">{{ st.id }}</td><td class="strong">{{ st.name }}</td><td class="email">{{ st.email }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SubjectDirectoryComponent implements OnInit {
  private http = inject(HttpClient);

  subjects = signal<SubjectItem[]>([]);
  students = signal<StudentItem[]>([]);
  enrollments = signal<EnrollmentItem[]>([]);

  loadingSubjects = signal(true);
  loadingStudents = signal(true);
  loadingEnrollments = signal(true);
  loadingRoster = signal(false);

  errorMsg = signal('');
  notification = signal('');
  enrollError = signal('');
  formError = signal('');
  deleteError = signal('');

  showForm = signal(false);
  editingId = signal<number | null>(null);
  formName = signal('');
  saving = signal(false);
  confirmDeleteId = signal<number | null>(null);

  enrollStudentId = signal<number | null>(null);
  enrollSubjectId = signal<number | null>(null);
  enrollmentsForStudentId = signal<number | null>(null);
  enrolling = signal(false);

  rosterSubjectId = signal<number | null>(null);
  rosterSubjectName = signal('');
  roster = signal<StudentItem[]>([]);

  canEnroll = computed(() => this.enrollStudentId() !== null && this.enrollSubjectId() !== null && !this.enrolling());

  visibleEnrollments = computed(() => {
    const filter = this.enrollmentsForStudentId();
    if (filter === null) return this.enrollments();
    return this.enrollments().filter(e => e.studentId === filter);
  });

  ngOnInit() {
    this.loadSubjects();
    this.loadStudents();
    this.loadEnrollments();
  }

  loadSubjects() {
    this.loadingSubjects.set(true);
    this.http.get<SubjectItem[]>(`${API}/Subjects`).subscribe({
      next: (res) => { this.subjects.set(res || []); this.loadingSubjects.set(false); },
      error: () => { this.loadingSubjects.set(false); this.errorMsg.set('Failed to load subjects.'); },
    });
  }

  loadStudents() {
    this.http.get<{ total: number; data: StudentItem[] }>(`${API}/Students?page=1&pageSize=200&sort=name`).subscribe({
      next: (res) => { this.students.set(res?.data || []); this.loadingStudents.set(false); },
      error: () => { this.loadingStudents.set(false); this.errorMsg.set('Failed to load students.'); },
    });
  }

  loadEnrollments() {
    this.loadingEnrollments.set(true);
    this.http.get<SubjectItem[]>(`${API}/Subjects`).subscribe({
      next: (subs) => {
        const list = subs || [];
        if (list.length === 0) { this.enrollments.set([]); this.loadingEnrollments.set(false); return; }
        let pending = list.length;
        const merged: EnrollmentItem[] = [];
        for (const s of list) {
          this.http.get<StudentItem[]>(`${API}/Enrollments/by-subject/${s.id}`).subscribe({
            next: (sts) => {
              for (const st of sts || []) merged.push({ studentId: st.id, subjectId: s.id, studentName: st.name, subjectName: s.name });
              if (--pending === 0) { this.enrollments.set(merged); this.loadingEnrollments.set(false); }
            },
            error: () => { if (--pending === 0) { this.enrollments.set(merged); this.loadingEnrollments.set(false); } },
          });
        }
      },
      error: () => { this.loadingEnrollments.set(false); this.errorMsg.set('Failed to load enrollments.'); },
    });
  }

  viewStudents(s: SubjectItem) {
    this.rosterSubjectId.set(s.id); this.rosterSubjectName.set(s.name); this.roster.set([]); this.loadingRoster.set(true);
    this.http.get<StudentItem[]>(`${API}/Enrollments/by-subject/${s.id}`).subscribe({
      next: (sts) => { this.roster.set(sts || []); this.loadingRoster.set(false); },
      error: () => { this.roster.set([]); this.loadingRoster.set(false); this.errorMsg.set('Failed to load students for this subject.'); },
    });
  }

  closeRoster() { this.rosterSubjectId.set(null); this.rosterSubjectName.set(''); this.roster.set([]); }

  openAdd() { this.editingId.set(null); this.formName.set(''); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); this.errorMsg.set(''); this.notification.set(''); }
  openEdit(s: SubjectItem) { this.editingId.set(s.id); this.formName.set(s.name); this.formError.set(''); this.showForm.set(true); this.confirmDeleteId.set(null); }
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
      this.http.put(`${API}/Subjects/${this.editingId()}`, payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Subject updated.'); this.loadSubjects(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Update failed.')); },
      });
    } else {
      this.http.post(`${API}/Subjects`, payload).subscribe({
        next: () => { this.showForm.set(false); this.editingId.set(null); this.saving.set(false); this.notification.set('Subject created.'); this.loadSubjects(); },
        error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'Could not create subject.')); },
      });
    }
  }

  confirmDelete() {
    const id = this.confirmDeleteId(); if (id === null) return;
    this.deleteError.set('');
    this.http.delete(`${API}/Subjects/${id}`).subscribe({
      next: () => { this.confirmDeleteId.set(null); this.deleteError.set(''); this.notification.set('Subject deleted.'); this.loadSubjects(); this.loadEnrollments(); },
      error: (err) => {
        // Keep dialog open so user can see the error message
        const msg = 'This subject still has enrolled students. Remove all enrollments first, then try deleting again.';
        this.deleteError.set(msg);
      },
    });
  }

  enroll() {
    const studentId = this.enrollStudentId(); const subjectId = this.enrollSubjectId();
    if (studentId === null || subjectId === null) { this.enrollError.set('Select both a student and a subject.'); return; }
    this.enrollError.set(''); this.enrolling.set(true);
    this.http.post(`${API}/Enrollments`, { studentId, subjectId }).subscribe({
      next: () => {
        this.enrolling.set(false);
        this.enrollStudentId.set(null); this.enrollSubjectId.set(null);
        this.notification.set('Student enrolled successfully.');
        this.loadSubjects(); this.loadEnrollments();
      },
      error: (err) => { this.enrolling.set(false); this.enrollError.set(this.apiError(err, 'Enrollment failed.')); },
    });
  }

  unenroll(e: EnrollmentItem) {
    this.http.delete(`${API}/Enrollments/${e.studentId}/${e.subjectId}`).subscribe({
      next: () => { this.notification.set('Enrollment removed.'); this.loadSubjects(); this.loadEnrollments(); },
      error: () => { this.errorMsg.set('Could not remove the enrollment.'); },
    });
  }
}
