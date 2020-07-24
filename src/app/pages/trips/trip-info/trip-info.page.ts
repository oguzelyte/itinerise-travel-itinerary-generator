import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { StorageService } from "../../../services/storage.service";
import { DbOperationsService } from "src/app/services/shared/db-operations.service";
import { AuthenticationService } from "src/app/services/shared/authentication.service";

@Component({
  selector: "app-trip-info",
  templateUrl: "./trip-info.page.html",
  styleUrls: ["./trip-info.page.scss"],
})
export class TripInfoPage implements OnInit {
  preferredTransport: any;
  endPreferredTransport: any;

  currentTrip: any;
  destCity: any;

  alternatives: any[] = [];
  endAlternatives: any[] = [];
  operators: string[];

  transports: {
    transit?: any;
    driving?: any;
  }[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private dbOp: DbOperationsService,
    private auth: AuthenticationService
  ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((paramMap) => {
      if (!paramMap.has("ID")) {
        //redirect
        this.router.navigate(["/trips"]);
        return;
      }
      // the path has to match the one in the routing config
      const tripID = paramMap.get("ID");
      if (this.auth.isLoggedIn) {
        this.dbOp.getTrip(tripID).subscribe((data) => {
          data.forEach(trip => {
            this.currentTrip = trip.payload.doc.data();
          });
          this.beautify();
        });
      } else {
        this.getStorage(tripID);
      }
    });
  }

  getStorage(key: string) {
    this.storage.getObject(key).then((data: any) => {
      this.currentTrip = data.trip;
      this.beautify();
    });
  }

  beautify() {
    // if destination cities are empty, then the destination is what the user entered, otherwise it's the first city from the list
    this.destCity = this.currentTrip.route.location[0].info.name;

    // if no transport routes found, then enter no transport
    if (this.currentTrip.route.transport.length == 0) {
      this.preferredTransport = "No transport found.";
      this.endPreferredTransport = "No transport found.";
    } else {
      // if transport options are found and are of type 'preferred transport', then enter the options
      this.currentTrip.route.transport.forEach((element) => {
        if (
          this.currentTrip.preferredTransport == element.type &&
          element.start
        ) {
          this.preferredTransport = element;
        } else if (
          this.currentTrip.preferredTransport == element.type &&
          !element.start
        ) {
          this.endPreferredTransport = element;
        }
      });


      // if there's no routes found for the preferred transport type, then choose the first transport route
      if (this.preferredTransport == undefined) {
        for (let index = 0; index < this.currentTrip.route.transport.length; index++) {
          if (this.currentTrip.route.transport[index].start) {
            this.preferredTransport = this.currentTrip.route.transport[index];
            break;
          } else {
            this.preferredTransport = "No transport found.";
          }
        }
      }

      if (this.endPreferredTransport == undefined) {
        for (let i = 0; i < this.currentTrip.route.transport.length; i++) {
          if (
            this.currentTrip.route.transport[i].end
          ) {
            this.endPreferredTransport = this.currentTrip.route.transport[i];
            break;
          } else {
            this.endPreferredTransport = "No transport found.";
          }
        }
      }

      this.currentTrip.route.transport.forEach(element => {
        if (
          this.preferredTransport.type != element.type &&
          element.start
        ) {

          this.alternatives[0] = element;
        }
        if (
          this.preferredTransport.type != element.type &&
          !element.start
        ) {
          this.endAlternatives[0] = element;
        }
      });
    }

    if (this.preferredTransport != "No transport found.") {
      this.preferredTransport.operators.forEach((item) => {
        this.preferredTransport.operators =
          this.preferredTransport.operators + ", " + item;
      });
    }

    if (this.endPreferredTransport != "No transport found.") {
      this.endPreferredTransport.operators.forEach((item) => {
        this.endPreferredTransport.operators =
          this.endPreferredTransport.operators + ", " + item;
      });
    }
  }
}
