import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TripinfoPageRoutingModule } from './tripinfo-routing.module';

import { TripinfoPage } from './tripinfo.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TripinfoPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [TripinfoPage]
})
export class TripinfoPageModule {}
