import { TestBed } from '@angular/core/testing';
import { BarangayState } from './barangay-state';

describe('BarangayState', () => {
  let service: BarangayState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarangayState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
