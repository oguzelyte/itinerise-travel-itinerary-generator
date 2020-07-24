import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";

const routes: Routes = [
  { path: "", redirectTo: "tabs/home", pathMatch: "full" },
  {
    path: "tabs",
    loadChildren: () =>
          import("./pages/tabs/tabs.module").then((m) => m.TabsPageModule),
  },
  {
    path: "tripinfo",
    loadChildren: () =>
          import("./pages/tripinfo/tripinfo.module").then((m) => m.TripinfoPageModule),
  },
  {
    path: "selection",
    loadChildren: () => import("./pages/selection/selection.module").then( m => m.SelectionPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
