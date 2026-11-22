import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, ViewChild } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonList, IonMenu, IonMenuButton,
  IonSelect, IonSelectOption, IonSplitPane, IonTitle, IonToolbar
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  documentOutline, homeOutline, listOutline, logOutOutline,
  megaphoneOutline, people, personCircleOutline, personOutline,
  ribbonOutline, shieldCheckmark
} from 'ionicons/icons';

interface CertificateRequestItem {
  id: number;
  request_code: string;
  username: string;
  resident_name: string;
  purok: string;
  certificate_type: string;
  request_date: string;
  request_time: string;
  status: string;
  archive_reason?: string;
  pdf_filename?: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface ResidentsResponse {
  total_residents: string;
}

interface SavedUserProfile {
  name: string;
  contact: string;
  address: string;
}

@Component({
  selector: 'app-resident-user',
  templateUrl: './resident-user.page.html',
  styleUrls: ['./resident-user.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonButtons, IonIcon, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonLabel, IonMenu, IonSplitPane,
    IonMenuButton, IonBadge, IonInput, IonSelect, IonSelectOption
  ]
})
export class ResidentUserPage implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/requests';
  private readonly residentsUrl = 'http://127.0.0.1:8000/settings/residents';
  private readonly announcementsUrl = 'http://127.0.0.1:8000/announcements';

  @ViewChild(IonContent) content!: IonContent;

  activeTab: string = 'dashboard';
  username: string = '';
  totalResidents: string = '245';

  barangayCaptain = 'Jeffrei Lee I. Abergas';
  kagawads = [
    'Carlo Aquino', 'Marbene Panesa', 'Efren Marcos', 'Girlie Morilla',
    'Jose Ramos', 'Manolito Abergas', 'Juanito Dela Cruz'
  ];
  skOfficials = ['Julius Eivan Abergas'];

  announcements: AnnouncementItem[] = [];

  newRequest = {
    name: '',
    purok: '',
    type: ''
  };

  myRequests: CertificateRequestItem[] = [];

  userProfile = {
    name: '',
    username: '',
    contact: '09123456789',
    address: 'Purok 1, San Anton'
  };

  constructor() {
    addIcons({
      logOutOutline, homeOutline, megaphoneOutline, personOutline,
      personCircleOutline, documentOutline, listOutline, shieldCheckmark,
      ribbonOutline, people
    });
  }

  ngOnInit(): void {
    const loggedUser = localStorage.getItem('barangay_username') || localStorage.getItem('username') || 'Resident';
    this.username = loggedUser;
    this.userProfile.username = loggedUser;
    this.userProfile.name = loggedUser;

    this.loadSavedProfile(loggedUser);
    this.loadRequests();
    this.loadTotalResidents();
    this.loadAnnouncements();
  }

  private getProfileStorageKey(user: string): string {
    return `resident_profile_${user.trim().toLowerCase()}`;
  }

  private loadSavedProfile(user: string): void {
    try {
      const raw = localStorage.getItem(this.getProfileStorageKey(user));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedUserProfile>;
      if (typeof parsed.name === 'string' && parsed.name.trim()) {
        this.userProfile.name = parsed.name.trim();
        this.username = parsed.name.trim();
      }
      if (typeof parsed.contact === 'string') {
        this.userProfile.contact = parsed.contact;
      }
      if (typeof parsed.address === 'string') {
        this.userProfile.address = parsed.address;
      }
    } catch (err: unknown) {
      console.error('Error loading saved profile:', err);
    }
  }

  loadTotalResidents(): void {
    this.http.get<ResidentsResponse>(this.residentsUrl).subscribe({
      next: (res: ResidentsResponse): void => {
        this.totalResidents = res.total_residents;
      },
      error: (err: unknown): void => console.error('Error loading total residents:', err)
    });
  }

  loadAnnouncements(): void {
    this.http.get<AnnouncementItem[]>(this.announcementsUrl).subscribe({
      next: (data: AnnouncementItem[]): void => {
        this.announcements = data;
      },
      error: (err: unknown): void => console.error('Error loading announcements:', err)
    });
  }

  loadRequests(): void {
    this.http.get<CertificateRequestItem[]>(this.apiUrl).subscribe({
      next: (data: CertificateRequestItem[]): void => {
        this.myRequests = data.filter((req: CertificateRequestItem): boolean =>
          Boolean(req.username && req.username.toLowerCase() === this.username.toLowerCase())
        );
      },
      error: (err: unknown): void => console.error('Error fetching requests:', err)
    });
  }

  submitRequest(): void {
    if (!this.newRequest.name.trim() || !this.newRequest.purok || !this.newRequest.type) {
      alert('Please enter your Full Name, select your Purok, and select a Certificate Type.');
      return;
    }

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const payload = {
      username: this.username,
      resident_name: this.newRequest.name.trim(),
      purok: this.newRequest.purok,
      certificate_type: this.newRequest.type,
      request_date: currentDate,
      request_time: currentTime
    };

    this.http.post(this.apiUrl, payload).subscribe({
      next: (): void => {
        alert('Your request has been successfully sent to the admin!');
        this.newRequest.name = '';
        this.newRequest.purok = '';
        this.newRequest.type = '';
        this.loadRequests();
      },
      error: (err: unknown): void => {
        console.error('Error submitting request:', err);
        alert('An error occurred while submitting your request.');
      }
    });
  }

  downloadPdf(filename: string): void {
    if (!filename) return;
    window.open(`http://127.0.0.1:8000/download-certificate/${filename}`, '_blank');
  }

  updateProfile(): void {
    const cleanName = this.userProfile.name.trim() || this.username;
    const cleanContact = this.userProfile.contact.trim();
    const cleanAddress = this.userProfile.address.trim();

    this.userProfile.name = cleanName;
    this.userProfile.contact = cleanContact;
    this.userProfile.address = cleanAddress;
    this.username = cleanName;

    const profileKey = this.getProfileStorageKey(this.userProfile.username || cleanName);
    const toSave: SavedUserProfile = {
      name: cleanName,
      contact: cleanContact,
      address: cleanAddress
    };

    localStorage.setItem(profileKey, JSON.stringify(toSave));
    localStorage.setItem('username', cleanName);
    alert('Profile (including address) successfully updated!');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Archived': return 'medium';
      default: return 'dark';
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (this.content) {
      void this.content.scrollToTop(300);
    }
  }

  logout(): void {
    localStorage.clear();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}