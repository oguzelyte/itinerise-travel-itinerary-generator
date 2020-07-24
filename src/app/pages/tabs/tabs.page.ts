import { Component, OnInit } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { Trip } from '../../interfaces/trip';
import { AuthenticationService } from 'src/app/services/shared/authentication.service';
import { DbOperationsService } from 'src/app/services/shared/db-operations.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {

  trips: Trip[] = [];

  constructor(
    private storage: StorageService,
    private auth: AuthenticationService,
    private dbOp: DbOperationsService,
  ) { }

  // make this return either local or remote trips
  ngOnInit() {
      this.checkTrips();
  }

  // check if logged in, then return either remote or local trips
  checkTrips() {
    if (this.auth.isLoggedIn) {
      this.trips = [];
      this.dbOp.getTrips().subscribe((data) => {
        data.forEach(function (doc) {
          this.trips.push(doc.payload.doc.data())
        }.bind(this));
      });
    } else {
      this.trips = [];
      this.getKeys();
    }
  }

  getKeys() {
    this.storage.getKeys().then((keys: any) => {
      keys.forEach(key => {
        this.getStorage(key);
      });
    });
  }

  getStorage(key: string) {
    this.storage.getObject(key).then((data: any) => {
      this.trips.push(data.trip);
    });
  }

  setTrips(trips: Trip[]) {
    this.trips = trips;
  }

}
