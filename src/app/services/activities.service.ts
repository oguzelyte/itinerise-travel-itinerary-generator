import { Injectable } from "@angular/core";
import Axios from "axios";
import * as yelpCategories from "../pages/trips/yelp-categories.json";
import { Trip } from "../interfaces/trip";

@Injectable({
  providedIn: "root",
})
export class ActivitiesService {
  constructor() {}

  inserts: {
    location: string;
    day: number;
    idx: number;
    start?: string;
    end?: string;
    name?: string;
    info?: any;
  }[] = [];

  placesAPIelements: {
    value: string;
    query: string;
  }[] = [];

  yelpAPIelements: {
    value: string;
    query: string;
  }[] = [];

  // trip info
  transport = "00:30";
  time: string;
  end: string;
  duration: number;
  // time spent at places randomised due to no access to google's 'avg time spent at location' API
  timeSpent: string;
  preferences: string;
  locations: {
    startDate?: Date;
    endDate?: Date;
    value: any;
    toDo?: any[];
  }[] = [];
  globalDays = 0;
  startDate: string;
  transportForwardDate: Date;
  transportForwardTime: string;
  transportBackDate: Date;
  transportBackTime: string;

  // api allowing to bypass CORS errors
  cors = "https://cors-anywhere.herokuapp.com/";

  yelpToken =
    "8X5_7iw1wSPJTvGyWk25ZR8hfDH89zN0ccuBo1WG9JCdADKmMR7nEzhRrjOtNjeXZY5hcad1hUQrsuddg5rq-V2ngpX6wwmB5nT2ex6J-UK2SOZC2mhaCPC0cLdtXnYx";
  map = new google.maps.Map(document.createElement("div"));
  service = new google.maps.places.PlacesService(this.map);

  setInfo(generatedTrip: Trip) {
    this.end = generatedTrip.endTime.slice(11, 16);
    this.duration = generatedTrip.duration;
    switch (generatedTrip.pace) {
      case "Flexible":
        this.timeSpent = "01:30";
        break;
      case "Relaxed":
        this.timeSpent = "02:00";
        break;
      case "Fast-paced":
        this.timeSpent = "01:00";
        break;
      default:
        break;
    }

    switch (generatedTrip.preferredActivities) {
      case "Popular":
        this.preferences = "Popular things to do";
        break;
      case "Balanced":
        this.preferences = "Tourist attractions";
        break;
      case "Hidden gems":
        this.preferences = "Hidden gems";
        break;
      default:
        break;
    }

    if (generatedTrip.route.transport.length != 0) {
      let currentStartT;
      let currentEndT;

      // repLACE WITH FOR LOOPS
      for (let i = 0; i < generatedTrip.route.transport.length; i++) {
        if (
          generatedTrip.route.transport[i].start === true &&
          generatedTrip.route.transport[i].type ===
            generatedTrip.preferredTransport
        ) {
          currentStartT = generatedTrip.route.transport[i];
        }
        if (
          generatedTrip.route.transport[i].start === false &&
          generatedTrip.route.transport[i].type ===
            generatedTrip.preferredTransport
        ) {
          currentEndT = generatedTrip.route.transport[i];
        }
      }

      currentStartT === undefined
        ? (currentStartT = generatedTrip.route.transport.find(
            ({ start }) => start === true
          ))
        : (currentStartT = currentStartT);
      currentEndT === undefined
        ? (currentEndT = generatedTrip.route.transport.find(
            ({ start }) => start === false
          ))
        : (currentEndT = currentEndT);

      if (currentStartT != undefined) {
        this.transportForwardDate = new Date(currentStartT.arrivalDate);
        this.transportForwardTime = currentStartT.endTime;
      }
      if (currentEndT != undefined) {
        this.transportBackDate = new Date(currentEndT.arrivalDate);
        this.transportBackTime = currentEndT.endTime;
      }
    }

    this.time = generatedTrip.startTime.slice(11, 16);
    this.startDate = generatedTrip.startDate;

    generatedTrip.route.location.forEach((element) => {
      this.locations.push({
        value: element,
      });
    });
  }

  setYelpAPIElements(interests: any[]) {
    interests.forEach((interest) => {
      switch (interest) {
        case "Sports":
          this.yelpAPIelements.push({
            value: interest,
            query: yelpCategories.sports.values,
          });
          break;
        case "Food":
          this.yelpAPIelements.push({
            value: interest,
            query: yelpCategories.food.values,
          });
          break;
        case "Beaches":
          this.yelpAPIelements.push({
            value: interest,
            query: yelpCategories.beaches.values,
          });
          break;
        case "Wildlife":
          this.yelpAPIelements.push({
            value: interest,
            query: yelpCategories.wildlife.values,
          });
          break;
        case "Events":
          this.yelpAPIelements.push({
            value: interest,
            query: "Events",
          });
          break;
        case "Outdoors":
          this.yelpAPIelements.push({
            value: interest,
            query: "Outdoor activities",
          });
          break;
        case "Romantic":
          this.yelpAPIelements.push({
            value: interest,
            query: "Romantic things to do",
          });
          break;
        case "Culture":
          this.yelpAPIelements.push({
            value: interest,
            query: "arts",
          });
          break;
        default:
          break;
      }
    });
  }

  async run() {
    let temp = new Date(this.startDate);
    for (let i = 0; i < this.locations.length; i++) {
      this.locations[i].startDate = new Date(temp.valueOf());
      let stayAtLocation = Number(
        this.locations[i].value.lengthOfStay.split(" ")[0]
      );
      isNaN(stayAtLocation)
        ? (stayAtLocation = 1)
        : (stayAtLocation = stayAtLocation);
      if (i == 0) {
        temp.setDate(temp.getDate() + stayAtLocation + 1);
      } else {
        temp.setDate(temp.getDate() + stayAtLocation);
      }
      this.locations[i].endDate = new Date(temp.valueOf());
      this.locations[i].toDo = [];
    }

    await this.generateSuggestions(this.yelpAPIelements, "yelp")
      .then(() => this.generateSuggestions(this.placesAPIelements, "places"))
      .then(() => {
        this.locations.forEach((location) => {
          this.shuffleArray(location.toDo);
        });
      })
      .then(() => this.generateInserts());
  }

  async generateSuggestions(arr: any[], type: string) {
    for (let i = 0; i < this.locations.length; i++) {
      for (let k = 0; k < arr.length; k++) {
        if (type == "places") {
          await this.getGooglePlaces(arr[k], this.locations[i]);
        } else {
          await this.getYelp(arr[k], this.locations[i]);
        }
      }
    }
  }
  async generateInserts() {
    for (let i = 0; i < this.locations.length; i++) {
      await this.compileActivities(this.locations[i]);
    }
  }

  getInserts(): any[] {
    return [...this.inserts];
  }

  clear(): void {
    while (this.inserts.length > 0) {
      this.inserts.pop();
    }

    while (this.placesAPIelements.length > 0) {
      this.placesAPIelements.pop();
    }

    while (this.yelpAPIelements.length > 0) {
      this.yelpAPIelements.pop();
    }

    while (this.locations.length > 0) {
      this.locations.pop();
    }
  }

  setPlacesAPIElements(interests: any[]) {
    interests.forEach((interest) => {
      switch (interest) {
        case "Museums":
          this.placesAPIelements.push({
            value: interest,
            query: "Museums",
          });
          break;
        case "Shopping":
          this.placesAPIelements.push({
            value: interest,
            query: "Shopping",
          });
          break;
        default:
          break;
      }
    });
  }

  unixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  getYelp(element: any, loc: any) {
    loc.value.info.formatted_address === undefined
      ? (loc.value.info.formatted_address = loc.value.info.name)
      : (loc.value.info.formatted_address = loc.value.info.formatted_address);
    let params2;
    let url;

    if (element.query == "Events") {
      params2 = {
        location: loc.value.info.formatted_address, // THIS BY GENERATE TRIP VALUE
        start_date: this.unixTimestamp(loc.startDate), // THIS BY GENERATED TRIP VALUE
        end_date: this.unixTimestamp(loc.endDate),
      };
      url = "https://api.yelp.com/v3/events";
    } else {
      if (element.value == "Romantic" || element.value == "Outdoors") {
        params2 = {
          term: element.query,
          location: loc.value.info.formatted_address,
        };
      } else {
        params2 = {
          categories: element.query,
          location: loc.value.info.formatted_address,
        };
      }
      url = "https://api.yelp.com/v3/businesses/search";
    }

    let config = {
      headers: { Authorization: "Bearer " + this.yelpToken },
      params: params2,
    };

    return new Promise(
      function (resolve, reject) {
        Axios.get(this.cors + url, config)
          .then((response) => {
            let res;
            response.data.businesses != undefined
              ? (res = response.data.businesses)
              : (res = response.data.events);

            if (res != undefined && res.length > 0) {
              for (let i = 0; i < res.length; i++) {
                loc.toDo.push(res[i]);
              }
            }
            resolve(response);
          })
          .catch((err) => {
            resolve(err);
          });
      }.bind(this)
    );
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getGooglePlaces(element: any, location: any) {
    location.value.info.formatted_address === undefined
      ? (location.value.info.formatted_address = location.value.info.name)
      : (location.value.info.formatted_address =
          location.value.info.formatted_address);
    return new Promise(
      function (resolve, reject) {
        let map = new google.maps.Map(document.createElement("div"));
        let service2 = new google.maps.places.PlacesService(map);
        service2.textSearch(
          {
            query:
              element.query + " in " + location.value.info.formatted_address,
          },
          function (results2, status2) {
            if (status2 == google.maps.places.PlacesServiceStatus.OK) {
              if (results2.length > 0) {
                for (let i = 0; i < results2.length; i++) {
                  location.toDo.push(results2[i]);
                }
              }
            }
            resolve(results2);
          }.bind(this)
        );
      }.bind(this)
    );

    // bind to trip service scope
  }

  // make this return the result to trip service tsf
  compileActivities(location2: any) {
    location2.value.info.formatted_address === undefined
      ? (location2.value.info.formatted_address = location2.value.info.name)
      : (location2.value.info.formatted_address =
          location2.value.info.formatted_address);
    return new Promise(
      function (resolve, reject) {
        let nm = 0;
        let temp;
        let getNextPage = null;
        let nextPage = false;
        let k = 0;
        let next = false;
        if (location2.value.lengthOfStay == "A few hours") {
          temp = 1;
        } else if (this.locations.length === 1) {
          temp = Number(location2.value.lengthOfStay.split(" ")[0]) + 1; // make '1' out of '1 Night'
        } else {
          temp = Number(location2.value.lengthOfStay.split(" ")[0]);
        }
        this.service.textSearch(
          {
            query:
              this.preferences +
              " in " +
              location2.value.info.formatted_address,
          },
          function (results, status, pagination) {
            k > 0 ? (next = true) : (next = false); // to prevent from starting a new day, and continuing where left
            let n = 0;
            let m = 0;

            if (
              status == google.maps.places.PlacesServiceStatus.OK &&
              (this.globalDays != this.duration ||
                this.locations[this.locations.length - 1].value.info.name ===
                  location2.value.info.name)
            ) {
              k = 0;

              for (k = 0; k < temp; k++) {
                this.globalDays += 1;
               
                if (this.globalDays == 1) {

                  if (this.transportForwardDate) {
                    if (
                      Date.parse(this.transportForwardDate) >
                      Date.parse(this.startDate.slice(0, 10))
                    ) {
                      this.time = "24:00";
                    } else {
                      this.time = this.transportForwardTime;
                    }
                  }
                } else if (next) {
                  next = false;
                } else {
                  if (this.transportForwardTime === undefined) {
                    this.time = "09:00";
                  } else {
                    this.time = this.transportForwardTime;
                    this.transportForwardTime = undefined;
                  }
                }

                if (this.getMs(this.time) < 9 * 3600000) {
                  this.time = "09:00";
                }

                while (this.enoughTime(this.time, this.timeSpent)) {
                  if (
                    (nm == 0 &&
                      location2.toDo.length != 0 &&
                      location2.toDo[n] != undefined) ||
                    (nm % 2 == 0 &&
                      location2.toDo.length != 0 &&
                      location2.toDo[n] != undefined)
                  ) {
                    let start = this.time;
                    let endTime =
                      this.getMs(start) + this.getMs(this.timeSpent);
                    let enoughTimeForEvent = false;
                    if (location2.toDo[n].time_start != undefined) {
                      let startT = location2.toDo[n].time_start.slice(11, 16);
                      let endT = location2.toDo[n].time_end.slice(11, 16);
                      let tSpent = this.convertToHrs(
                        this.getMs(endT) - this.getMs(startT)
                      );
                      if (
                        this.getMs(startT) >= this.getMs(this.time) &&
                        this.enoughTime(startT, tSpent)
                      ) {
                        start = startT;
                        endTime = this.getMs(endT);
                        enoughTimeForEvent = true;
                      }
                    }

                    if (
                      enoughTimeForEvent ||
                      location2.toDo[n].time_start == undefined
                    ) {
                      this.inserts.push({
                        location: location2.value.info.name,
                        day: this.globalDays,
                        idx: k,
                        start: start,
                        end: this.convertToHrs(endTime),
                        info: location2.toDo[n],
                      });

                      this.time = this.convertToHrs(
                        endTime + this.getMs(this.transport)
                      );
                    }
                    n++;
                    nm++;
                  } else if (results[m] != undefined) {
                    nextPage = false;
                    this.inserts.push({
                      location: location2.value.info.name,
                      day: this.globalDays,
                      idx: k,
                      start: this.time,
                      end: this.convertToHrs(
                        this.getMs(this.time) + this.getMs(this.timeSpent)
                      ),
                      info: results[m],
                    });
                    m++;
                    nm++;
                    this.time = this.convertToHrs(
                      this.getMs(this.time) +
                        this.getMs(this.timeSpent) +
                        this.getMs(this.transport)
                    );
                  } else if (results[m] == undefined && !nextPage) {
                    nextPage = true;
                    if (pagination.hasNextPage) {
                      m = 0;
                      pagination.nextPage();
                      //setTimeout(() => {}, 2000);
                    } else {
                      break;
                    }
                  }
                }

                if (
                  (k == 0 || k == temp - 1 || this.transportForwardDate) &&
                  this.inserts.find((element) => element.idx == k) == undefined
                ) {
                  this.inserts.push({
                    location: location2.value.info.name,
                    day: this.globalDays,
                    idx: k,
                    info: {
                      name: "No activities fit in this day.",
                    },
                  });
                }
              }
              resolve(results);
              //this.clear();
            } else {
              this.service.textSearch(
                {
                  query:
                    "Popular things to do in " +
                    location2.value.info.formatted_address,
                },
                function (results, status, pagination) {
                  k > 0 ? (next = true) : (next = false); // to prevent from starting a new day, and continuing where left
                  let n = 0;
                  let m = 0;
                  if (
                    status == google.maps.places.PlacesServiceStatus.OK &&
                    this.globalDays != this.duration
                  ) {
                    k = 0;

                    for (k = 0; k < temp; k++) {
                      this.globalDays += 1;
                      if (this.globalDays == 1) {
                        if (this.transportForwardDate) {
                          if (
                            Date.parse(this.transportForwardDate) >
                            Date.parse(this.startDate.slice(0, 10))
                          ) {
                            this.time = "24:00";
                          } else {
                            this.time = this.transportForwardTime;
                          }
                        }
                      } else if (next) {
                        next = false;
                      } else {
                        if (this.transportForwardTime === undefined) {
                          this.time = "09:00";
                        } else {
                          this.time = this.transportForwardTime;
                          this.transportForwardTime = undefined;
                        }
                      }

                      if (this.getMs(this.time) < 9 * 3600000) {
                        this.time = "09:00";
                      }

                      while (this.enoughTime(this.time, this.timeSpent)) {
                        if (results[m] != undefined) {
                          nextPage = false;
                          this.inserts.push({
                            location: location2.value.info.name,
                            day: this.globalDays,
                            idx: k,
                            start: this.time,
                            end: this.convertToHrs(
                              this.getMs(this.time) + this.getMs(this.timeSpent)
                            ),
                            info: results[m],
                          });
                          m++;
                          nm++;
                          this.time = this.convertToHrs(
                            this.getMs(this.time) +
                              this.getMs(this.timeSpent) +
                              this.getMs(this.transport)
                          );
                        } else if (results[m] == undefined && !nextPage) {
                          nextPage = true;
                          if (pagination.hasNextPage) {
                            m = 0;
                            pagination.nextPage();
                            //setTimeout(() => {}, 2000);
                          } else {
                            break;
                          }
                        }
                      }

                      if (
                        (k == 0 ||
                          k == temp - 1 ||
                          this.transportForwardDate) &&
                        this.inserts.find((element) => element.idx == k) ==
                          undefined
                      ) {
                        this.inserts.push({
                          location: location2.value.info.name,
                          day: this.globalDays,
                          idx: k,
                          info: {
                            name: "No activities fit in this day.",
                          },
                        });
                      }
                    }
                    resolve(results);
                  }
                }.bind(this)
              );
            }
          }.bind(this)
        ); // bind to trip service scope
      }.bind(this)
    );
  }

  daysBetween(startDate, endDate) {
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return (
      (this.treatAsUTC(endDate).getTime() -
        this.treatAsUTC(startDate).getTime()) /
      millisecondsPerDay
    );
  }

  treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  }

  enoughTime(time: string, interestsTime: string): Boolean {
    let startTime = this.getMs(time);
    let endTime = this.getMs(interestsTime);
    let maxTime = 18 * 3600000;

    if (this.globalDays == this.duration) {
      if (this.transportBackDate != undefined) {
        maxTime = this.getMs(this.transportBackTime);
      } else {
        maxTime = this.getMs(this.end);
      }
    }

    if (startTime + endTime <= maxTime) {
      return true;
    } else {
      return false;
    }
  }

  getMs(time: string) {
    let arr: string[] = String(time).split(":");
    return Number(arr[0]) * 3600000 + Number(arr[1]) * 60000;
  }

  convertToHrs(timeInMiliseconds: number) {
    let h, m, s;
    h = Math.floor(timeInMiliseconds / 1000 / 60 / 60);
    m = Math.floor(timeInMiliseconds / 1000 / 60 - h * 60);
    m < 10 ? (m = "0" + m) : (m = m);
    h < 10 ? (h = "0" + h) : (h = h);
    s = Math.floor(((timeInMiliseconds / 1000 / 60 / 60 - h) * 60 - m) * 60);
    return h + ":" + m;
  }
}
