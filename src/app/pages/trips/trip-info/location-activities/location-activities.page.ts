import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { StorageService } from "../../../../services/storage.service";
import { AuthenticationService } from 'src/app/services/shared/authentication.service';
import { DbOperationsService } from 'src/app/services/shared/db-operations.service';

@Component({
  selector: "app-location-activities",
  templateUrl: "./location-activities.page.html",
  styleUrls: ["./location-activities.page.scss"],
})
export class LocationActivitiesPage implements OnInit {
  location: string;
  days: any[] = [];
  trip: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private auth: AuthenticationService,
    private dbOp: DbOperationsService
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      if (!paramMap.has("name")) {
        //redirect
        this.router.navigate(["tabs/trips/:ID"]);
        return;
      }

      // the path has to match the one in the routing config
      const ID = paramMap.get("ID");
      this.location = paramMap.get("name");

      if (this.auth.isLoggedIn) {
        this.dbOp.getTrip(ID).subscribe((data) => {
          data.forEach(trip => {
            this.trip = trip.payload.doc.data();
          });
          this.calculate();          
        });
      } else {
        this.storage.getObject(ID).then((data: any) => {
          this.trip = data.trip;
          this.calculate();
        });
      }
    });
  }

  calculate(){
    for (let i = 0; i < this.trip.route.location.length; i++) {
      if (this.trip.route.location[i].info.name === this.location) {
        this.days = this.trip.route.location[i].days;
      }
    }

    this.days.length == 0
      ? (this.days[0] = "No activities found.")
      : (this.days = this.days);
  }

  getAccurateDate(days: number): string {
    days = days - 1; // minus 1, since 1st day has to be 0, it's the first day of the trip
    let date = new Date(this.trip.startDate);
    date.setDate(date.getDate() + days);
    return date.toDateString();
  }
}
