import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TripsPage } from './trips.page';

const routes: Routes = [
  {
    path: '',
    component: TripsPage,
    children: [
      {
        path: 'tripinfo',
        redirectTo: '/tripinfo',
        pathMatch: 'full'
      },
      {
        path: 'home',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'trip-info',
        loadChildren: () => import('./trip-info/trip-info.module').then( m => m.TripInfoPageModule)
      }
    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TripsPageRoutingModule {}
