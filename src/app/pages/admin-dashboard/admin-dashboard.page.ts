import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, 
  IonInput, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, 
  IonSplitPane, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle, documentText, documentTextOutline, homeOutline, 
  logOutOutline, megaphoneOutline, people, peopleOutline, 
  personCircleOutline, ribbonOutline, shieldCheckmark, timeOutline, archiveOutline 
} from 'ionicons/icons';


@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonButton, IonButtons, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonMenu,
    IonSplitPane, IonMenuButton, IonBadge, IonInput, IonTextarea
  ]
})
export class AdminDashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/requests';
  private readonly settingsUrl = 'http://127.0.0.1:8000/settings/residents';
  private readonly announcementsUrl = 'http://127.0.0.1:8000/announcements';

  totalResidents: string = '245';

  barangayCaptain = "Jeffrei Lee I. Abergas";
  kagawads = [
    "Carlo Aquino", "Marbene Panesa", "Efren Marcos", "Girlie Morilla",
    "Jose Ramos", "Manolito Abergas", "Juanito Dela Cruz"
  ];
  skOfficials = ["Julius Eivan Abergas"];

  allRequests: any[] = [];
  certificateRequests: any[] = [];
  historyLogs: any[] = [];

  announcements: any[] = [];
  announcementForm = { id: null, title: '', description: '', date: '' };
  isEditingAnnouncement: boolean = false;

  constructor() {
    addIcons({ 
      logOutOutline, peopleOutline, documentTextOutline, shieldCheckmark, 
      homeOutline, megaphoneOutline, timeOutline, personCircleOutline, 
      ribbonOutline, people, documentText, checkmarkCircle, archiveOutline 
    });
  }

  ngOnInit(): void {
    this.loadRequests();
    this.loadTotalResidents();
    this.loadAnnouncements();
  }

  loadTotalResidents(): void {
    this.http.get<any>(this.settingsUrl).subscribe({
      next: (res) => { this.totalResidents = res.total_residents; },
      error: (err) => console.error('Error loading total residents:', err)
    });
  }

  editTotalResidents(): void {
    const newTotal = prompt('Enter new total residents:', this.totalResidents);
    if (newTotal !== null && newTotal.trim() !== '') {
      this.http.put(this.settingsUrl, { total_residents: newTotal.trim() }).subscribe({
        next: () => {
          this.totalResidents = newTotal.trim();
          alert('Total residents successfully updated!');
        },
        error: (err) => console.error('Error updating residents:', err)
      });
    }
  }

  loadRequests(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.allRequests = data;
        this.filterData();
      },
      error: (err) => console.error('Error loading requests:', err)
    });
  }

  filterData(): void {
    this.certificateRequests = this.allRequests.filter(r => r.status === 'Pending');
    this.historyLogs = this.allRequests.filter(r => r.status !== 'Pending');
  }

  get pendingCount(): number {
    return this.allRequests.filter(r => r.status === 'Pending').length;
  }

  get approvedCount(): number {
    return this.allRequests.filter(r => r.status === 'Approved').length;
  }

  get archivedCount(): number {
    return this.allRequests.filter(r => r.status === 'Archived').length;
  }

  updateStatus(id: number, newStatus: string, reqCode: string): void {
    if (newStatus === 'Archived') {
      const reason = prompt('Enter the reason for archiving this request:');
      if (reason === null) return;
      
      this.http.put(`${this.apiUrl}/${id}`, { status: newStatus, archive_reason: reason || 'No reason provided' }).subscribe({
        next: () => {
          alert(`Request ${reqCode} has been archived and moved to history.`);
          this.loadRequests();
        },
        error: (err) => console.error('Error archiving request:', err)
      });
    } else {
      this.http.put(`${this.apiUrl}/${id}`, { status: newStatus }).subscribe({
        next: () => {
          alert(`Request ${reqCode} has been approved, PDF generated, and moved to history.`);
          this.loadRequests(); 
        },
        error: (err) => console.error('Error updating status:', err)
      });
    }
  }

  viewPdf(filename: string): void {
    if (!filename) return;
    window.open(`http://127.0.0.1:8000/download-certificate/${filename}`, '_blank');
  }

  loadAnnouncements(): void {
    this.http.get<any[]>(this.announcementsUrl).subscribe({
      next: (data) => { this.announcements = data; },
      error: (err) => console.error('Error loading announcements:', err)
    });
  }

  saveAnnouncement(): void {
    if (!this.announcementForm.title || !this.announcementForm.description || !this.announcementForm.date) {
      alert('Please fill out all announcement fields.');
      return;
    }

    if (this.isEditingAnnouncement && this.announcementForm.id) {
      this.http.put(`${this.announcementsUrl}/${this.announcementForm.id}`, this.announcementForm).subscribe({
        next: () => {
          alert('Announcement updated successfully!');
          this.cancelEditAnnouncement();
          this.loadAnnouncements();
        },
        error: (err) => console.error('Error updating announcement:', err)
      });
    } else {
      this.http.post(this.announcementsUrl, this.announcementForm).subscribe({
        next: () => {
          alert('Announcement posted successfully!');
          this.announcementForm = { id: null, title: '', description: '', date: '' };
          this.loadAnnouncements();
        },
        error: (err) => console.error('Error posting announcement:', err)
      });
    }
  }

  editAnnouncement(ann: any): void {
    this.isEditingAnnouncement = true;
    this.announcementForm = { ...ann };
  }

  cancelEditAnnouncement(): void {
    this.isEditingAnnouncement = false;
    this.announcementForm = { id: null, title: '', description: '', date: '' };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Archived': return 'medium';
      default: return 'dark';
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}