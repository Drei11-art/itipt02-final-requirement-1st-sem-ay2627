import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResidentUserPage } from './resident-user.page';

describe('ResidentUserPage', () => {
  let component: ResidentUserPage;
  let fixture: ComponentFixture<ResidentUserPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ResidentUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
