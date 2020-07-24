import { Injectable } from '@angular/core';
import { Trip } from '../interfaces/trip';
//import { TripService } from './trip.service';
import { map, catchError } from 'rxjs/operators';
import { of, Observable, forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { resolve } from 'url';

@Injectable({
  providedIn: 'root'
})
export class FindBusesService {

  lowestFare: any;
  prices: any[] = [];
  startStops: any[] = [];
  destStops: any[] = [];
  busToken: string = "Token EJG0szAm_-nus-FrfTkwtw";
  searchEndPt: string = "https://api.idbus.com/v1/search";
  stopsEndPt: string = "https://api.idbus.com/v1/stops";

  generatedTrip: Trip;
  constructor(
    private http: HttpClient
    ) {

  }

  setTrip(trip: Trip){
    this.generatedTrip = trip;
  }

  async getBuses(
    destLat: number,
    destLng: number,
    startLat = this.generatedTrip.startCity.lat,
    startLng = this.generatedTrip.startCity.lng,
    start = true
  ) {
    const headers = {
      Authorization: this.busToken,
    };

    await this.http
      .get(this.stopsEndPt, {
        headers,
      })
      .subscribe(
        (res) => {
          res["stops"].forEach((element) => {
            let checkLat = element["latitude"];
            let checkLng = element["longitude"];

            // start location
            var ky = 40000 / 360;
            var kx = Math.cos((Math.PI * startLat) / 180.0) * ky;
            var dx = Math.abs(startLng - checkLng) * kx;
            var dy = Math.abs(startLat - checkLat) * ky;

            // dest location
            var kx2 = Math.cos((Math.PI * destLat) / 180.0) * ky;
            var dx2 = Math.abs(destLng - checkLng) * kx2;
            var dy2 = Math.abs(destLat - checkLat) * ky;

            if (Math.sqrt(dx * dx + dy * dy) <= 30) {
              this.startStops.push(element);
            }

            if (Math.sqrt(dx2 * dx2 + dy2 * dy2) <= 30) {
              this.destStops.push(element);
            }
          });
        },
        (err) => alert("invalid Credentials"),
        () => {
          if (this.startStops.length == 0 || this.destStops.length == 0) {
            console.log("No routes found. Blabla bus does not operate here.");
            //this.tripService.setTCalc();
             //this.tripService.checkGetActivities();
          } else {
            console.log(this.startStops);
            console.log(this.destStops);

            const h2 = {
              headers: new HttpHeaders({
                Authorization: this.busToken,
                "Content-Type": "application/json",
              }),
            };

            let passengers = [
              {
                id: null,
                age: null,
              },
            ];

            passengers = [];

            for (let i = 0; i < this.generatedTrip.travellerCount; i++) {
              passengers[i] = {
                id: i + 1,
                age: 30,
              };
            }

            let observables: Observable<any>[] = [];

            for (let k = 0; k < this.startStops.length; k++) {
              for (let l = 0; l < this.destStops.length; l++) {
                let body = JSON.stringify({
                  origin_id: this.startStops[k]["id"],
                  destination_id: this.destStops[l]["id"],
                  date: this.generatedTrip.startDate.slice(0, 10),
                  passengers: passengers,
                });

                observables.push(
                  this.http.post(this.searchEndPt, body, h2).pipe(
                    map((res) => res),
                    catchError((e) => of(null))
                  )
                );
              }
            }

            forkJoin(observables).subscribe(
              async (res) => {
              console.log(res);
              let lowest = Number.MAX_SAFE_INTEGER;
              for (let i = 0; i < res.length; i++) {
                if (res[i] != null) {
                  res[i]["trips"].forEach((element) => {
                    if (start) {
                      if (
                        element["departure"].slice(11, 16) >=
                          this.generatedTrip.startTime.slice(11, 16) &&
                        element["price_cents"] < lowest
                      ) {
                        lowest = element["price_cents"];
                        this.lowestFare = element;
                      }
                    } else {
                      if (
                        element["departure"].slice(11, 16) <
                          this.generatedTrip.endTime.slice(11, 16) &&
                        element["price_cents"] < lowest
                      ) {
                        lowest = element["price_cents"];
                        this.lowestFare = element;
                      }
                    }
                  });
                }
              }
              if (this.lowestFare != undefined) {
                let startT = this.lowestFare["departure"].slice(11, 19);
                let endT = this.lowestFare["arrival"].slice(11, 19);
                let busDuration = this.getBusDuration(startT, endT);
                let transport = {
                  start: start,
                  type: "Bus",
                  startTime: this.lowestFare["departure"].slice(11, 16),
                  endTime: this.lowestFare["arrival"].slice(11, 16),
                  price: this.lowestFare["price_cents"] / 100,
                  currency: String(this.lowestFare["price_currency"]),
                  duration: busDuration,
                  operators: ["BlaBlaBus"],
                };
                console.log(this.generatedTrip.route);

                this.generatedTrip.route.transport.push(transport);

                console.log(this.lowestFare); // save the lowest, cheapest fare
              } else {
                console.log("No available buses found.");
              }
            },
            ).add(()=>{
              //this.tripService.setTCalc();
              //this.tripService.checkGetActivities();
            }
            );
          }
        }
      );
  }

  seconds(time_str) {
    // Extract hours, minutes and seconds
    var parts = time_str.split(":");
    // compute  and return total seconds
    return (
      parts[0] * 3600 + // an hour has 3600 seconds
      parts[1] * 60 + // a minute has 60 seconds
      +parts[2]
    ); // seconds
  }

  getBusDuration(startT: string, endT: string) {
    let difference = Math.abs(this.seconds(endT) - this.seconds(startT));

    // compute hours, minutes and seconds
    var result = [
      // an hour has 3600 seconds so we have to compute how often 3600 fits
      // into the total number of seconds
      Math.floor(difference / 3600), // HOURS
      // similar for minutes, but we have to "remove" the hours first;
      // this is easy with the modulus operator
      Math.floor((difference % 3600) / 60), // MINUTES
      // the remainder is the number of seconds
      difference % 60, // SECONDS
    ];

    let hr = result[0];
    let remainMin = result[1];
    return hr + "H" + remainMin + "M";
  }

}

