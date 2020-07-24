import { TestBed } from '@angular/core/testing';

import { FindFlightsService } from './find-flights.service';

describe('FindFlightsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FindFlightsService = TestBed.get(FindFlightsService);
    expect(service).toBeTruthy();
  });
});
