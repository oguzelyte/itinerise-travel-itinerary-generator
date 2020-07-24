import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TripinfoPage } from './tripinfo.page';

describe('TripinfoPage', () => {
  let component: TripinfoPage;
  let fixture: ComponentFixture<TripinfoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TripinfoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TripinfoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
