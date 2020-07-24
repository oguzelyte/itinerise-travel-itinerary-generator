import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TripInfoPage } from './trip-info.page';

describe('TripInfoPage', () => {
  let component: TripInfoPage;
  let fixture: ComponentFixture<TripInfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TripInfoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TripInfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
