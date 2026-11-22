import { CommonModule } from '@angular/common';
import { Component, inject, type Signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  documentText,
  documentTextOutline,
  homeOutline,
  logOutOutline,
  megaphoneOutline,
  people,
  peopleOutline,
  shieldCheckmark,
} from 'ionicons/icons';


@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class AdminDashboardPage {
  private readonly barangayState = inject(BarangayStateService);
  private readonly router = inject(Router);

  readonly username: Signal<string> = this.barangayState.currentUsername;
  readonly role: Signal<string> = this.barangayState.currentRole;

  totalResidents = '245';
  barangayCaptain = 'Hon. Barangay Captain';

  constructor() {
    addIcons({
      homeOutline,
      peopleOutline,
      documentTextOutline,
      megaphoneOutline,
      logOutOutline,
      people,
      documentText,
      shieldCheckmark,
    });
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  logout(): void {
    this.barangayState.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}