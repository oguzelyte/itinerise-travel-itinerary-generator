import { Injectable } from "@angular/core";
import { Trip } from "../interfaces/trip";
import { v4 as uuidv4 } from "uuid";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { Observable, forkJoin } from "rxjs";
import { of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { google } from "google-maps";
import { ActivitiesService } from "./activities.service";
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { DbOperationsService } from './shared/db-operations.service';
import { AuthenticationService } from './shared/authentication.service';
import { FindBusesService } from './find-buses.service';


declare var require: any;
declare var google: google;

@Injectable({
  providedIn: "root",
})
export class TripService {
  private trips: Trip[] = [] 

  tCalcCity: number = 0; //calculations for found transport for city destination
  // BUSES //
  lowestFare: any;
  prices: any[] = [];
  startStops: any[] = [];
  destStops: any[] = [];
  busToken: string = "Token EJG0szAm_-nus-FrfTkwtw";
  searchEndPt: string = "https://api.idbus.com/v1/search";
  stopsEndPt: string = "https://api.idbus.com/v1/stops";
  // BUSES //

  res: any;
  generatedTrip: Trip;
  day: any[];
  transportID: number = 0;
  directionsAPI = "https://maps.googleapis.com/maps/api/directions/json?";
  keyAPI = "AIzaSyCwuzbBCoFv59SmnirmY_Lbp3R-oN1BZ2k";
  results: any[] = [];

  // PLANES //
  destCities: any[] = [];
  destIATA: any;
  startIATA: any;
  url: string = "http://iatageo.com/getCode/";
  amadeus: any;
  clientID: string = "3d7LoArSWWko9VhEf77GWnBHD9BiyZMr";
  clientSecret: string = "np0rYz6At78KfMz6";
  flights: {
    departureTime: string;
    departureDate: string;
    arrivalDate: string;
    arrivalTime: string;
    duration: string;
    airline: string[];
    buy: string; // add link to website
    currency: string;
    price: number;
  }[];
  // PLANES //

  constructor(
    private http: HttpClient,
    private activities: ActivitiesService,
    private storage: StorageService,
    private router: Router,
    private dbOp: DbOperationsService,
    private auth: AuthenticationService,
    private findBuses: FindBusesService
    ) {
    this.generatedTrip = null;
    this.destCities = [];
  }

  async generateTrip(trip: Trip): Promise<void> {
    // create local copy of current trip and set its duration and title

    this.generatedTrip = trip;
    this.generatedTrip.route = { transport: [], location: [] };
    this.setDuration();
    this.generatedTrip.ID = trip.title + "-" + uuidv4();

    // if destination is a city, get flights
    if (this.generatedTrip.destination.isCity) {
      let stay: any = this.generatedTrip.duration - 1;
      stay = stay == 0 ? "A few hours" : stay + " nights";
      this.generatedTrip.route.location.push({
        info: this.generatedTrip.destination,
        lengthOfStay: stay,
      });
      this.findBuses.setTrip(this.generatedTrip);
      this.getIATA();

      this.getIATA(
        this.generatedTrip.startCity.lat,
        this.generatedTrip.startCity.lng,
        this.generatedTrip.destination.lat,
        this.generatedTrip.destination.lng,
        false
      );

        this.getBuses(
          this.generatedTrip.destination.lat,
          this.generatedTrip.destination.lng
        );
        
      this.getBuses(
        this.generatedTrip.endCity.lat,
        this.generatedTrip.endCity.lng,
        this.generatedTrip.destination.lat,
        this.generatedTrip.destination.lng,
        false
      );

    } 
    else {
      this.getCities();
    }
    this.trips.push(this.generatedTrip); 
  }

  getIATA(
    destLat = this.generatedTrip.destination.lat,
    destLng = this.generatedTrip.destination.lng,
    startLat = this.generatedTrip.startCity.lat,
    startLng = this.generatedTrip.startCity.lng,
    start = true
  ) {
    // Get IATA code for flights
    this.getIataCodeForLocation(destLat, destLng).subscribe((data: any) => {
      this.getIataCodeForLocation(startLat, startLng).subscribe(
        (data2: any) => {
          this.getFlights(start, data.IATA, data2.IATA)
        }
      )
    });
  }

  getIataCodeForLocation(lat: number, lng: number) {
    return this.http.get(this.url + lat + "/" + lng);
  }

  // gets amadeus flights
  getFlights(start = true, destIATA: string, startIATA: string) {
    const headers = {
      "Content-type": "application/x-www-form-urlencoded",
    };

    const body = new HttpParams()
      .set("grant_type", "client_credentials")
      .set("client_id", this.clientID)
      .set("client_secret", this.clientSecret);

    this.http
      .post("https://test.api.amadeus.com/v1/security/oauth2/token", body, {
        headers,
      })
      .subscribe(
        (res) => {
          let temp: string;
          temp = res["access_token"];

          var headers = {
            Authorization: "Bearer " + temp,
          };

          let departure = start
            ? this.generatedTrip.startDate.slice(0, 10)
            : this.generatedTrip.endDate.slice(0, 10);

          this.http
            .get(
              "https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=" +
                startIATA +
                "&destinationLocationCode=" +
                destIATA +
                "&departureDate=" +
                departure +
                "&adults=" +
                this.generatedTrip.travellerCount +
                "&max=30",
              { headers }
            )
            .subscribe(
              function (res) {
              this.flights = [];
              for (let offer of Object.keys(res["data"])) {
                let segments =
                  res["data"][offer]["itineraries"][0]["segments"][0];

                // make sure return flight is before the time, and figure out why 2 flights are added

                let flightTime = segments["departure"]["at"].slice(11, 16);

                if (!start) {
                  
                  
                  let time = this.generatedTrip.endTime.slice(11, 16);
                  if (flightTime >= time) {
                    let carriers: string[] = [];
                    let segments2 =
                      res["data"][offer]["itineraries"][0]["segments"];
                    segments2.forEach(function (element) {
                      carriers.push(element.carrierCode);
                    }.bind(this));
                    this.flights.push({
                      departureDate: segments["departure"]["at"].slice(0,10), 
                      arrivalDate: segments2[segments2.length - 1]["arrival"]["at"].slice(0,10),
                      departureTime: flightTime,
                      arrivalTime: segments2[segments2.length - 1]["arrival"][
                        "at"
                      ].slice(11, 16),
                      duration:
                        res["data"][offer]["itineraries"][0]["duration"],
                      buy: "test",
                      airline: carriers,
                      currency: res["data"][offer]["price"]["currency"],
                      price: res["data"][offer]["price"]["grandTotal"],
                    });
                  }
                } else {
                  let time = this.generatedTrip.startTime.slice(11, 16);
                  let startDate = new Date(this.generatedTrip.startDate.slice(0,10));
                  if (flightTime >= time) {
                    let carriers: string[] = [];
                    let segments2 =
                      res["data"][offer]["itineraries"][0]["segments"];
                    segments2.forEach(function (element)  {
                      carriers.push(element.carrierCode);
                    });

                    let possibleDate = new Date (segments2[segments2.length - 1]["arrival"]["at"].slice(0,10));
                    if(this.daysBetween(startDate, possibleDate) == 1) // check if price of flight is smaller than previous and the trip length is no longer than a day
                    {
                      this.flights.push({
                      departureTime: flightTime,
                      departureDate: segments["departure"]["at"].slice(0,10), 
                      arrivalDate:segments2[segments2.length - 1]["arrival"]["at"].slice(0,10),
                      arrivalTime: segments2[segments2.length - 1]["arrival"][
                        "at"
                      ].slice(11, 16),
                      duration:
                        res["data"][offer]["itineraries"][0]["duration"],
                      buy: "test",
                      airline: carriers,
                      currency: res["data"][offer]["price"]["currency"],
                      price: res["data"][offer]["price"]["grandTotal"],
                    });
                    }
                  

                  }

                }

                if (this.flights.length == 5) {
                  break;
                }
              }
              if (this.flights.length != 0) {
                let max = Number.MAX_SAFE_INTEGER;
                let flight;

                for (let options of Object.keys(
                  res["dictionaries"]["carriers"]
                )) {
                  for (let i = 0; i < this.flights.length; i++) {
                    if (this.flights[i].price < max) { 
                      max = this.flights[i].price;
                      flight = this.flights[i];
                    }
                    for (let k = 0; k < this.flights[i].airline.length; k++) {
                      this.flights[i].airline[k] === options
                        ? (this.flights[i].airline[k] =
                            res["dictionaries"]["carriers"][options])
                        : null;
                    }
                  }
                }

                let transport = {
                  start: start,
                  type: "Plane",
                  departureDate: flight.departureDate,
                  arrivalDate: flight.arrivalDate,
                  startTime: flight.departureTime,
                  endTime: flight.arrivalTime,
                  price: flight.price,
                  currency: flight.currency,
                  duration: flight.duration,
                  operators: flight.airline,
                };

                this.generatedTrip.route.transport.push(transport);
              } else {
              }
              
            }.bind(this)
            ).add(()=>{
              this.tCalcCity += 1;
              this.checkGetActivities();
            });
        },
        (err) => {
          this.tCalcCity += 1;
              this.checkGetActivities();
        }
      )
    }

  buildTripDays(arr: any[]) {
    this.generatedTrip.route.location.forEach((el) => {
      el.days = [];
    });
    arr.forEach((element) => {
      this.generatedTrip.route.location.forEach((loc) => {
        if (element.location == loc.info.name) {
          let push, placeTags, placeImg, placeLocation, thisSpecialTag;
          let thisDescription, thisUrl, thisPrice = "";
          let thisStart = element.start;
          let thisEnd = element.end;
          if (element.info.name == 'No activities fit in this day.') {
            push = {
              title: String(element.info.name),
            };
          } else {
            if (element.info.geometry != undefined) { // if its a Google Places object
              placeTags = element.info.types.join(", ");
              element.info.photos != undefined ? placeImg = element.info.photos[0].getUrl() : placeImg = "No image.";
              placeLocation = element.info.geometry;
            } else if (element.info.categories != undefined) { // if it's a yelp business search object
              placeTags = element.info.categories
                .map((e) => e.title)
                .join(", ");
              placeImg = element.info.image_url;
              placeLocation = element.info.coordinates;
            } else { // if it's a yelp event
              thisDescription = element.info.description;
              placeTags = element.info.category;
              thisSpecialTag = "Event";
              thisUrl = element.info.event_site_url;
              placeImg = element.info.image_url;
              thisPrice = element.info.cost || "Free";
              thisStart = element.info.time_start.slice(11,16);
              thisEnd = element.info.time_end.slice(11,16);
              placeLocation = {
                latitude : element.info.latitude,
                longitude : element.info.longitude
              }
            }
            push = {
              price: thisPrice,
              specialTag: thisSpecialTag,
              description: thisDescription,
              title: String(element.info.name) || "No Title Exists",
              startTime: thisStart,
              endTime: thisEnd,
              idx: element.idx,
              tags: placeTags || "No tags.",
              img: placeImg || "No image.",
              rating: element.info.rating || "No rating information.",
              location: placeLocation,
            };
          }

          if (typeof loc.days[element.idx] === "undefined") {
            loc.days.push({
              day: element.day,
              activity: [push],
            });
          } else if (
            loc.days.find(({ day }) => day == element.day) == undefined
          ) {
            loc.days.push({
              day: element.day,
              activity: [push],
            });
          } else {
            loc.days[element.idx].activity.push(push);
          }
        }
      });
    });

    if(this.auth.isLoggedIn)
    {
      this.generatedTrip.userID = this.auth.userData.uid;
    } else {
      this.setStorage();
    } 
  }

  setStorage() {
    this.storage.setObject(this.generatedTrip.ID, {
      trip: this.generatedTrip
    }).then(() => {
      let id = this.generatedTrip.ID;
      this.generatedTrip = undefined;
      this.tCalcCity = 0;
      this.router.navigate(["/tabs/trips/" + id]);
      
    });
  }

  create(trip: Trip){
    this.dbOp.createTrip(trip).then(
      () => 
      {
        let id = this.generatedTrip.ID;
        this.generatedTrip = undefined;
        this.tCalcCity = 0;
        this.router.navigate(["/tabs/trips/" + id])
      }
      );
  }

  getActivities() {
    this.activities.setYelpAPIElements(this.generatedTrip.interests);
    this.activities.setPlacesAPIElements(this.generatedTrip.interests);
    this.activities.setInfo(this.generatedTrip);
    this.activities
      .run()
      .then(() => 
      {
        this.buildTripDays(this.activities.getInserts());
        this.activities.clear();
      }
      );
  }

  getBuses(
    destLat: number,
    destLng: number,
    startLat = this.generatedTrip.startCity.lat,
    startLng = this.generatedTrip.startCity.lng,
    start = true
  ) {
    const headers = {
      Authorization: this.busToken,
    };

    this.http
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
            this.tCalcCity += 1;
              this.checkGetActivities();
          } else {

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
              (res) => {
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
                    }});}}
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
                this.generatedTrip.route.transport.push(transport);

              } else {
              }
            },
            ).add(()=>{
              this.tCalcCity += 1;
              this.checkGetActivities();
            }
            );
          }
        }
      );
  }

  checkGetActivities() {
    if(this.tCalcCity == 4)
    {
      this.getActivities();
    }
  }

  calculateTransports() {
    let options = [
      google.maps.TravelMode.DRIVING,
      google.maps.TravelMode.TRANSIT,
    ];
    var directionsService = new google.maps.DirectionsService();

    // leaving city time
    var result = new Date(
      this.generatedTrip.startDate.slice(0, 10) + "T08:30:00.000Z"
    );

    for (let i = 0; i < this.generatedTrip.route.location.length - 1; i++) {
      this.generatedTrip.route.location[i].transport = [];
      let location = this.generatedTrip.route.location[i];
      result.setDate(
        result.getDate() +
          Number(
            this.generatedTrip.route.location[i].lengthOfStay.split(" ")[0]
          )
      );

      options.forEach((mode) => {
        var request;
        if (mode == google.maps.TravelMode.DRIVING) {
          request = {
            origin: { placeId: location.info.place_id },
            destination: {
              placeId: this.generatedTrip.route.location[i + 1].info.place_id,
            },
            travelMode: mode,
            drivingOptions: {
              departureTime: result,
            },
          };
        } else {
          request = {
            origin: { placeId: location.info.place_id },
            destination: {
              placeId: this.generatedTrip.route.location[i + 1].info.place_id,
            },
            travelMode: mode,
            transitOptions: {
              departureTime: result,
            },
          };
        }

        directionsService.route(
          request,
          function (result, status) {
            if (status == "OK") {
              let type = "";
              let start;
              let end;
              let duration;
              let tempDate = 0;
              let tempDur = 0;

              if (mode == google.maps.TravelMode.DRIVING) {

                type = "Driving";
                start = result.request.drivingOptions.departureTime;
                result.routes[0].legs.forEach((element) => {
                  let temp = element.duration.text.split(" ");
                  tempDur +=
                    Number(temp[0]) * 3600000 + Number(temp[2]) * 60000;
                  tempDate += new Date(start).getTime() + tempDur;
                });
                end = new Date(tempDate);
              } else {

                result.routes[0].legs.forEach((element) => {
                  element.steps.forEach((el) => {
                    let travelMode;
                    if (el.transit.line.vehicle.name != undefined) {
                      travelMode = el.transit.line.vehicle.name.toLowerCase();
                    } else {
                      travelMode = el.travel_mode.toLowerCase();
                    }
                    let travelModeUpper =
                      travelMode.charAt(0).toUpperCase() +
                      travelMode.substring(1);
                    if (type != "") {
                      type = type + " + " + travelModeUpper;
                    } else {
                      type = travelModeUpper;
                    }
                  });
                });

                start = result.routes[0].legs[0].departure_time.text;
                end =
                  result.routes[0].legs[result.routes[0].legs.length - 1]
                    .arrival_time.text;
                result.routes[0].legs.forEach((element) => {
                  let temp = element.duration.text.split(" ");
                  tempDur +=
                    Number(temp[0]) * 3600000 + Number(temp[2]) * 60000;
                });
              }
              duration = this.convertToHrs(tempDur);
              this.generatedTrip.route.location[i].transport.push({
                type: type,
                startTime: start,
                endTime: end,
                duration: duration,
              });
            }
          }.bind(this)
        );
      });
    }

  }

  convertToHrs(timeInMiliseconds: number) {
    let h, m, s;
    h = Math.floor(timeInMiliseconds / 1000 / 60 / 60);
    m = Math.floor((timeInMiliseconds / 1000 / 60 / 60 - h) * 60);
    s = Math.floor(((timeInMiliseconds / 1000 / 60 / 60 - h) * 60 - m) * 60);
    return h + " h " + m + " min";
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

  getCities() {
    let map = new google.maps.Map(document.createElement("div"));

    let service = new google.maps.places.PlacesService(map);

    // send a query
    service.textSearch(
      { query: "Cities in " + this.generatedTrip.destination.name },
      async function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          let k = 0;
          for (var i = 0; i < results.length; i++) {
            this.destCities.push(results[i]);
            k++;
            if (this.generatedTrip.duration == k) {
              break;
            }
          }
          this.generatedTrip.destCities = this.destCities;
          this.prepareRoutes();
          this.calculateTransports();
          let dest = this.destCities[0].geometry.location;
          this.getBuses(dest.lat(), dest.lng());
          this.getIATA(dest.lat(), dest.lng());
        }
      }.bind(this)
    ); // bind to trip service scope
  }

  async prepareRoutes() {
    let k = 0;
    for (let i = 0; i < this.generatedTrip.destCities.length; i++) {
      let days;

      if (this.generatedTrip.duration <= k) {
        break;
      }

      if (i == 0) {
        days = Math.ceil(this.generatedTrip.duration * 0.3) + 1;
      } else if (i == 1 || i == 2 || i == 3) {
        days = Math.ceil(this.generatedTrip.duration * 0.2);
      } else {
        days = Math.ceil(this.generatedTrip.duration * 0.1);
      }

      k += days;
      if (k > this.generatedTrip.duration) {
        days = days - (k - this.generatedTrip.duration) - 1;
      } else if (k == this.generatedTrip.duration) {
        days = days - 1;
      }

      days = days == 0 ? "A few hours" : days + " nights";
      this.generatedTrip.route.location.push({
        info: this.generatedTrip.destCities[i],
        lengthOfStay: days,
      });
    }

    let start = this.destCities[this.destCities.length - 1].geometry.location;
    this.getBuses(
      this.generatedTrip.endCity.lat,
      this.generatedTrip.endCity.lng,
      start.lat(),
      start.lng(),
      false
    );
    this.getIATA(
      this.generatedTrip.endCity.lat,
      this.generatedTrip.endCity.lng,
      start.lat(),
      start.lng(),
      false
    );
  }

  treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  }

  //consider making a service with just these methods
  daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    let res = (this.treatAsUTC(endDate).getTime() - this.treatAsUTC(startDate).getTime()) / millisecondsPerDay;
    return Math.abs(res);
  }

  seconds(timeStr) {
    // Extract hours, minutes and seconds
    var parts = timeStr.split(":");
    // compute  and return total seconds
    return (
      parts[0] * 3600 + // an hour has 3600 seconds
      parts[1] * 60 + // a minute has 60 seconds
      +parts[2]
    ); // seconds
  }

  // TEST WITH DESTINATION COUNTRY AND ALSO IF ITS A CITY THEN DESTINATION HAS TO BE TEMP + 1 BECAUSE OTHERWISE ONLY 4 OUT OF 5 DAYS GET PLANNED
  setDuration() {
    let start = this.generatedTrip.startDate.slice(0, 10);
    let end = this.generatedTrip.endDate.slice(0, 10);

    let duration = this.daysBetween(start, end) + 1;

    duration == 1
      ? (this.generatedTrip.title =
          duration + " Day in " + this.generatedTrip.destination.name)
      : (this.generatedTrip.title =
          duration + " Days in " + this.generatedTrip.destination.name);

    this.generatedTrip.duration = duration;
  }

  getAllTrips() {
    // creates a copy of the array
    return [...this.trips];
  }

  getTrip(tripID: string) {
    return {
      ...this.trips.find((trip) => {
        return trip.ID === tripID;
      }),
    };
  }
}
