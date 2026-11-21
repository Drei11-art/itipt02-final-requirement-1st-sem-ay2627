import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-resident-user',
  templateUrl: './resident-user.page.html',
  styleUrls: ['./resident-user.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class ResidentUserPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
