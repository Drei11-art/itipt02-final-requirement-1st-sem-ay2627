import { CommonModule } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
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
  documentOutline,
  homeOutline,
  listOutline,
  logOutOutline,
  megaphoneOutline,
  people,
  personOutline,
  shieldCheckmark,
} from 'ionicons/icons';

import { BarangayStateService } from '../../services/barangay-state';

type ResidentTab = 'dashboard' | 'request' | 'track' | 'announcements' | 'profile';

@Component({
  selector: 'app-resident-user',
  templateUrl: './resident-user.page.html',
  styleUrls: ['./resident-user.page.scss'],
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
export class ResidentUserPage {
  private readonly barangayState = inject(BarangayStateService);
  private readonly router = inject(Router);

  readonly username: Signal<string> = this.barangayState.currentUsername;
  readonly role: Signal<string> = this.barangayState.currentRole;

  activeTab: ResidentTab = 'dashboard';
  totalResidents = '245';
  barangayCaptain = 'Hon. Barangay Captain';

  constructor() {
    addIcons({
      homeOutline,
      documentOutline,
      listOutline,
      megaphoneOutline,
      personOutline,
      logOutOutline,
      people,
      shieldCheckmark,
    });
  }

  switchTab(tab: ResidentTab): void {
    this.activeTab = tab;
  }

  logout(): void {
    this.barangayState.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}