import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TripinfoPage } from './tripinfo.page';

const routes: Routes = [
  {
    path: '',
    component: TripinfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TripinfoPageRoutingModule {}
