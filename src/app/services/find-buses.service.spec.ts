import { TestBed } from '@angular/core/testing';

import { FindBusesService } from './find-buses.service';

describe('FindBusesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FindBusesService = TestBed.get(FindBusesService);
    expect(service).toBeTruthy();
  });
});
