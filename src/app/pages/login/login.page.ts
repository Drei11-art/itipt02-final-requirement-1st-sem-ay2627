import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import type { ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  checkmarkCircleOutline,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  personAddOutline,
  personOutline,
  shieldCheckmark
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class LoginPage implements ViewWillEnter {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://127.0.0.1:8000';

  isRegisterMode = false;
  showPassword = false;

  loginData = {
    username: '',
    password: ''
  };

  registerData = {
    username: '',
    password: '',
    confirmPassword: ''
  };

  constructor() {
    addIcons({
      shieldCheckmark,
      personOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowForwardOutline,
      personAddOutline,
      checkmarkCircleOutline
    });
  }

  // Awtomatikong binubura ang lahat ng input fields sa login at register pagpasok o pag-logout
  ionViewWillEnter(): void {
    this.clearAllData();
  }

  clearAllData(): void {
    this.loginData = { username: '', password: '' };
    this.registerData = { username: '', password: '', confirmPassword: '' };
    this.showPassword = false;
    this.isRegisterMode = false;
  }

  switchMode(register: boolean): void {
    this.isRegisterMode = register;
    // Kapag lumipat sa pagitan ng Sign In at Create Account, binubura agad ang mga na-type
    this.loginData = { username: '', password: '' };
    this.registerData = { username: '', password: '', confirmPassword: '' };
    this.showPassword = false;
  }

  onLogin(): void {
    if (!this.loginData.username.trim() || !this.loginData.password.trim()) {
      alert('Please enter both username and password.');
      return;
    }

    const credentials = {
      username: this.loginData.username.trim(),
      password: this.loginData.password
    };

    this.http.post<any>(`${this.baseUrl}/login`, credentials).subscribe({
      next: (res) => {
        localStorage.setItem('username', res.username);
        localStorage.setItem('role', res.role);

        // Burahin ang credentials sa form bago lumipat ng page
        this.clearAllData();

        if (res.role === 'admin') {
          this.router.navigate(['/admin-dashboard'], { replaceUrl: true });
        } else {
          this.router.navigate(['/resident-user'], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.loginData.password = '';
        alert(err.error?.detail || 'Invalid username or password.');
      }
    });
  }

  onRegister(): void {
    if (!this.registerData.username.trim() || !this.registerData.password.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const payload = {
      username: this.registerData.username.trim(),
      password: this.registerData.password,
      role: 'resident'
    };

    this.http.post<any>(`${this.baseUrl}/register`, payload).subscribe({
      next: () => {
        alert('Registration successful! Please sign in with your new account.');
        // Linisin ang register form at bumalik sa login form na blangko
        this.clearAllData();
        this.isRegisterMode = false;
      },
      error: (err) => {
        alert(err.error?.detail || 'Registration failed.');
      }
    });
  }
}