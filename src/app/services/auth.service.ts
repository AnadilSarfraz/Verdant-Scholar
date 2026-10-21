import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  userName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

const TOKEN_KEY = 'vs_auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = 'https://localhost:7235/api/auth';

  /** Decoded JWT payload, so the UI can show the signed-in user without a profile endpoint. */
  readonly user = signal<AuthUser | null>(this.readUserFromToken());

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, { email, password })
      .pipe(tap(res => {
        sessionStorage.setItem(TOKEN_KEY, res.token);
        this.user.set(res.user);
      }));
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
  }

  /** Reads the subject/email/role claims out of the stored JWT. */
  private readUserFromToken(): AuthUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: Number(payload.sub),
        userName: payload.email ?? '',
        email: payload.email ?? '',
        role: payload.role ?? '',
      };
    } catch {
      return null;
    }
  }
}
