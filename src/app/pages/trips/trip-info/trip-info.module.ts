import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TripInfoPageRoutingModule } from './trip-info-routing.module';

import { TripInfoPage } from './trip-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TripInfoPageRoutingModule
  ],
  declarations: [TripInfoPage]
})
export class TripInfoPageModule {}
