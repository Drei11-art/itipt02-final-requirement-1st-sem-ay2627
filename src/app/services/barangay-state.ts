import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Observable } from 'rxjs';

const USERNAME_KEY = 'barangay_username';
const ROLE_KEY = 'barangay_role';

export interface SessionUser {
  username: string;
  role: string;
}

export interface CertificateRequestItem {
  id: number;
  request_code: string;
  username: string;
  resident_name: string;
  purok?: string;
  certificate_type: string;
  request_date: string;
  request_time: string;
  status: string;
  archive_reason?: string;
  pdf_filename?: string;
}

export interface CreateCertificateRequestPayload {
  username: string;
  resident_name: string;
  purok?: string;
  certificate_type: string;
  request_date: string;
  request_time: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  description: string;
  date: string;
}

export interface AnnouncementPayload {
  title: string;
  description: string;
  date: string;
}

interface ResidentsResponse {
  total_residents: string;
}

@Injectable({
  providedIn: 'root',
})
export class BarangayStateService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000';

  private readonly usernameSignal = signal<string>(this.readStorage(USERNAME_KEY));
  private readonly roleSignal = signal<string>(this.readStorage(ROLE_KEY));
  private readonly totalResidentsSignal = signal<string>('245');
  private readonly requestsSignal = signal<CertificateRequestItem[]>([]);
  private readonly announcementsSignal = signal<AnnouncementItem[]>([]);

  readonly currentUsername = this.usernameSignal.asReadonly();
  readonly currentRole = this.roleSignal.asReadonly();
  readonly isLoggedIn = computed<boolean>(() => Boolean(this.usernameSignal()));
  readonly totalResidents = this.totalResidentsSignal.asReadonly();
  readonly requests = this.requestsSignal.asReadonly();
  readonly announcements = this.announcementsSignal.asReadonly();

  // --- Auth endpoints (mula sa dating AuthService) ---
  register(userData: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // --- Session state (signals + localStorage) ---
  setSession(session: SessionUser): void {
    const cleanUsername = session.username.trim();
    const cleanRole = session.role.trim() || 'resident';

    this.usernameSignal.set(cleanUsername);
    this.roleSignal.set(cleanRole);

    this.writeStorage(USERNAME_KEY, cleanUsername);
    this.writeStorage(ROLE_KEY, cleanRole);
  }

  clearSession(): void {
    this.usernameSignal.set('');
    this.roleSignal.set('');

    this.removeStorage(USERNAME_KEY);
    this.removeStorage(ROLE_KEY);
  }

  // --- Residents count ---
  async loadTotalResidents(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<ResidentsResponse>(`${this.apiUrl}/settings/residents`)
      );
      if (res?.total_residents !== undefined) {
        this.totalResidentsSignal.set(String(res.total_residents));
      }
    } catch (err: unknown) {
      console.error('Error loading total residents:', err);
    }
  }

  async updateTotalResidents(totalResidents: string): Promise<void> {
    await firstValueFrom(
      this.http.put<ResidentsResponse>(`${this.apiUrl}/settings/residents`, {
        total_residents: totalResidents,
      })
    );
    this.totalResidentsSignal.set(totalResidents);
  }

  // --- Certificate requests & PDF download ---
  async loadRequests(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<CertificateRequestItem[]>(`${this.apiUrl}/requests`)
      );
      this.requestsSignal.set(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error fetching requests:', err);
    }
  }

  async submitRequest(payload: CreateCertificateRequestPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${this.apiUrl}/requests`, payload));
    await this.loadRequests();
  }

  async updateRequestStatus(
    requestId: number,
    status: string,
    archiveReason?: string
  ): Promise<void> {
    await firstValueFrom(
      this.http.put(`${this.apiUrl}/requests/${requestId}`, {
        status,
        archive_reason: archiveReason ?? null,
      })
    );
    await this.loadRequests();
  }

  getCertificateDownloadUrl(filename: string): string {
    return `${this.apiUrl}/download-certificate/${encodeURIComponent(filename)}`;
  }

  // --- Announcements ---
  async loadAnnouncements(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<AnnouncementItem[]>(`${this.apiUrl}/announcements`)
      );
      this.announcementsSignal.set(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error('Error loading announcements:', err);
    }
  }

  async saveAnnouncement(payload: AnnouncementPayload, announcementId?: number): Promise<void> {
    if (announcementId !== undefined) {
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/announcements/${announcementId}`, payload)
      );
    } else {
      await firstValueFrom(this.http.post(`${this.apiUrl}/announcements`, payload));
    }
    await this.loadAnnouncements();
  }

  // --- Safe storage helpers ---
  private readStorage(key: string): string {
    try {
      return localStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }
}