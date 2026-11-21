import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { BarangayStateService } from '../../services/barangay-state';

interface ApiErrorResponse {
  error?: {
    detail?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonTitle,
    IonHeader,
    IonToolbar,
  ],
})
export class RegisterPage {
  private readonly barangayState = inject(BarangayStateService);
  private readonly router = inject(Router);

  userData = {
    username: '',
    password: '',
    role: 'resident',
  };

  onRegister(): void {
    if (!this.userData.username.trim() || !this.userData.password.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload = {
      username: this.userData.username.trim(),
      password: this.userData.password,
      role: 'resident',
    };

    this.barangayState.register(payload).subscribe({
      next: (response: unknown): void => {
        console.log('Registration successful:', response);
        alert('Registration successful! You can now log in.');

        this.userData = { username: '', password: '', role: 'resident' };
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: (err: unknown): void => {
        console.error('Registration failed:', err);
        const apiError = err as ApiErrorResponse;
        const errorMessage =
          apiError?.error?.detail ||
          apiError?.message ||
          'Registration failed. That username may already be taken.';
        alert(errorMessage);
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}