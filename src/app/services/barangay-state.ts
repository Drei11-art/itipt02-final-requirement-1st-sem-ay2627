import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { type Observable, tap } from 'rxjs';

export interface AuthResponse {
  message?: string;
  username: string;
  role: string;
  user_type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BarangayStateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  readonly currentUsername = signal<string>(localStorage.getItem('username') || '');
  readonly currentRole = signal<string>(localStorage.getItem('role') || '');

  setSession(username: string, role: string): void {
    this.currentUsername.set(username);
    this.currentRole.set(role);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
  }

  clearSession(): void {
    this.currentUsername.set('');
    this.currentRole.set('');
    localStorage.clear();
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap((res: AuthResponse): void => {
          const role = res.role || res.user_type || 'resident';
          this.setSession(res.username, role);
        })
      );
  }

  register(userData: { username: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      username: userData.username,
      password: userData.password,
      role: userData.role || 'resident',
    });
  }
}