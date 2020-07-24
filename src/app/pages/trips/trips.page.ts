import { Component, OnInit } from "@angular/core";
import { Trip } from "../../interfaces/trip";
import { StorageService } from "../../services/storage.service";
import { AlertController } from "@ionic/angular";
import { Router, ActivatedRoute } from "@angular/router";
import { TabsPage } from "../tabs/tabs.page";
import { DbOperationsService } from "../../services/shared/db-operations.service";
import { AuthenticationService } from "../../services/shared/authentication.service";

@Component({
  selector: "app-trips",
  templateUrl: "./trips.page.html",
  styleUrls: ["./trips.page.scss"],
})
export class TripsPage implements OnInit {
  trips: Trip[] = [];

  constructor(
    private storage: StorageService,
    public alertController: AlertController,
    private router: Router,
    private tabs: TabsPage,
    private dbOp: DbOperationsService,
    public auth: AuthenticationService,
    private aRouter: ActivatedRoute
  ) {
  }

  ngOnInit() {
    let k = 0;
    this.aRouter.paramMap.subscribe((params) => {
      if (this.auth.isLoggedIn) {
        if (k == 0) {
          this.trips = [];
          this.dbOp.getTrips().subscribe((data) => {
            data.forEach(function (doc) {
              // doc.data() is never undefined for query doc snapshots
              this.trips.push(doc.payload.doc.data())
            }.bind(this));
          }).add(() => this.tabs.setTrips(this.trips));
          k++;
        }
      } else {
        k = 0;
        this.trips = [];
        this.getKeys();
      }
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  getKeys() {
    this.storage.getKeys().then((keys: any) => {
      keys.forEach((key) => {
        this.getStorage(key);
      });
    });
  }

  getStorage(key: string) {
    this.storage.getObject(key).then((data: any) => {
      this.trips.push(data.trip);
    }).finally(() => this.tabs.setTrips(this.trips));
  }

  async deleteTrip(trip: Trip, i: number) {
    const alert = await this.alertController.create({
      header: "Confirmation",
      message: "Are you sure you want to delete this trip?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
          },
        },
        {
          text: "Yes",
          handler: () => {
            this.trips = [];
            if (this.auth.isLoggedIn) {
              this.dbOp.getTrip(trip.ID).subscribe((data) => {
                data.forEach(function (doc) {
                  this.delete(doc.payload.doc.id);
                }.bind(this));
              }).add(() => {
                this.tabs.setTrips(this.trips.splice(i, 1));
              });
            } else {
              this.storage
                .removeItem(trip.ID)
                .then(() => this.getKeys())
                .then(() => this.tabs.setTrips(this.trips));
            }
          },
        },
      ],
    });

    await alert.present();
  }

  delete(id: string) {
    this.dbOp.deleteTrip(id);
  }

  async deleteAllTrips() {
    const alert = await this.alertController.create({
      header: "Confirmation",
      message: "Are you sure you want to delete all trips?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "secondary",
          handler: (blah) => {
          },
        },
        {
          text: "Yes",
          handler: () => {
            this.trips = [];
            this.storage
              .clear()
              .then(() => this.getKeys())
              .then(() => this.tabs.setTrips(this.trips));
          },
        },
      ],
    });

    await alert.present();
  }
}
