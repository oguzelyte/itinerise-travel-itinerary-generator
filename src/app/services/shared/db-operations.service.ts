import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Trip } from "src/app/interfaces/trip";
import { AuthenticationService } from "./authentication.service";

@Injectable({
  providedIn: "root",
})
export class DbOperationsService {
  
  private trip: Trip;

  constructor(
    private firestore: AngularFirestore,
    private auth: AuthenticationService) { }

  getTrips() {
    if (this.auth.isLoggedIn) {
      return this.firestore.collectionGroup("trips", ref => ref.where('userID', '==', JSON.parse(localStorage.getItem("user")).uid)).snapshotChanges();
    }
  }

  getUser() {
    if (this.auth.isLoggedIn) {
      return this.firestore.doc("users/" + JSON.parse(localStorage.getItem("user")).uid).get();
    }
  }

  getTrip(tripID: string) {
    if (this.auth.isLoggedIn) {
      return this.firestore.collectionGroup("trips", ref => ref.where('ID', '==', tripID)).snapshotChanges();
    }
  }

  createTrip(trip: Trip) {
    return this.firestore.collection("trips").add(JSON.parse(JSON.stringify(trip)));
  }

  updateTrip(trip: Trip) {
    delete trip.ID;
    this.firestore.doc("trips/" + trip.ID).update(trip);
  }

  deleteTrip(tripID: string) {
    this.firestore.doc("trips/" + tripID).delete();
  }

}
