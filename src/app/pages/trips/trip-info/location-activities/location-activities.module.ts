import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LocationActivitiesPageRoutingModule } from './location-activities-routing.module';

import { LocationActivitiesPage } from './location-activities.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LocationActivitiesPageRoutingModule
  ],
  declarations: [LocationActivitiesPage]
})
export class LocationActivitiesPageModule {}
