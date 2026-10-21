import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-shell">
      <section class="login-card" aria-labelledby="login-heading">
        <div class="login-brand">
          <span class="brand-mark" aria-hidden="true">C</span>
          <div>
            <h1 id="login-heading" class="login-title">Verdant Scholar</h1>
            <p class="login-sub">College Management System</p>
          </div>
        </div>

        @if (errorMsg()) { <div class="alert alert-error" role="alert">{{ errorMsg() }}</div> }

        <form (submit)="$event.preventDefault(); submit()" class="login-form">
          <div class="field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autocomplete="username"
              required
              [(ngModel)]="email"
              placeholder="you@verdant.scholar"
            />
          </div>

          <div class="field">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autocomplete="current-password"
              required
              [(ngModel)]="password"
              placeholder="Enter your password"
            />
          </div>

          <button class="btn btn-primary login-submit" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="login-foot">Access is limited to registered staff accounts.</p>
      </section>
    </div>
  `,
  styles: `
    .login-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(31, 95, 74, 0.10), transparent 60%),
        var(--vs-page-bg);
      color: var(--vs-text);
      font-family: var(--vs-font-sans);
    }

    .login-card {
      width: min(420px, 100%);
      background: var(--vs-card);
      border: 1px solid var(--vs-border);
      border-radius: var(--vs-radius-lg);
      box-shadow: var(--vs-shadow-lg);
      padding: 2rem 1.75rem 1.5rem;
    }

    .login-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--vs-brass), var(--vs-brass-accent));
      color: var(--vs-sidebar);
      display: grid;
      place-items: center;
      font-family: var(--vs-font-serif);
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .login-title {
      font-family: var(--vs-font-serif);
      font-size: 1.4rem;
      font-weight: 400;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
    }

    .login-sub {
      margin: 0.1rem 0 0;
      font-size: 0.8rem;
      color: var(--vs-text-muted);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .login-submit {
      width: 100%;
      justify-content: center;
      margin-top: 0.35rem;
      padding: 0.65rem 1rem;
    }

    .login-foot {
      margin: 1.25rem 0 0;
      padding-top: 1rem;
      border-top: 1px solid var(--vs-border-soft);
      font-size: 0.78rem;
      color: var(--vs-text-muted);
      text-align: center;
    }

    @media (max-width: 480px) {
      .login-card { padding: 1.5rem 1.25rem 1.25rem; }
    }
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  submit() {
    if (this.loading()) return;
    if (!this.email.trim() || !this.password) {
      this.errorMsg.set('Enter both your email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.password = '';
        this.errorMsg.set(
          err?.status === 401
            ? 'Invalid email or password.'
            : 'Could not reach the sign-in service. Please try again.',
        );
      },
    });
  }
}
