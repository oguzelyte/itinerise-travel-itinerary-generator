import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { TabsPage } from "./tabs.page";

const routes: Routes = [
  {
    path: "",
    component: TabsPage,
    children: [
      {
        path: "home",
        loadChildren: () =>
          import("../home/home.module").then((m) => m.HomePageModule),
        pathMatch: "full"
      },
      {
        path: 'login',
        loadChildren: () => import('../login/login.module').then( m => m.LoginPageModule)
      },
      {
        path: 'registration',
        loadChildren: () => import('../registration/registration.module').then( m => m.RegistrationPageModule)
      },
      {
        path: 'verify-email',
        loadChildren: () => import('../verify-email/verify-email.module').then( m => m.VerifyEmailPageModule)
      },
      {
        path: "tripinfo",      
        redirectTo: "/tripinfo",
        pathMatch: "full" 
      },
      {
        path: "trips",
        children: [
          {
            path: "",
            loadChildren: () =>
              import("../../pages/trips/trips.module").then((m) => m.TripsPageModule),
          },
          {
            path: ":ID",
            children: [
              {
                path: "",
                loadChildren: () =>
                  import("../trips/trip-info/trip-info.module").then(
                    (m) => m.TripInfoPageModule
                  ),
              },
              {
                path: ":name",
                loadChildren: () =>
                  import(
                    "../trips/trip-info/location-activities/location-activities.module"
                  ).then((m) => m.LocationActivitiesPageModule),
              },
            ],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
