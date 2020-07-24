import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LocationActivitiesPage } from './location-activities.page';

const routes: Routes = [
  {
    path: '',
    component: LocationActivitiesPage
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LocationActivitiesPageRoutingModule {}
