import { Component, OnInit, NgZone } from "@angular/core";
import {
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
} from "@angular/forms";
import { Router, NavigationExtras } from "@angular/router";
import { google } from "google-maps";

declare var google: google;

@Component({
  selector: "app-tripinfo",
  templateUrl: "./tripinfo.page.html",
  styleUrls: ["./tripinfo.page.scss"],
})
export class TripinfoPage implements OnInit {
  // Fixes ISO date inaccuracy
  temp = new Date().getTimezoneOffset() * 60000;
  // Gets local date
  startDate = new Date(Date.now() - this.temp).toISOString().slice(0, -1);
  currentYear = new Date(Date.now()).getFullYear();
  endDate = new Date(Date.now() - this.temp).toISOString().slice(0, -1);

  startTime = this.startDate;
  endTime = this.startDate;

  travellerCount: number;
  different: Boolean = true;
  notSelected: Boolean = true;
  private GoogleAutocomplete: google.maps.places.AutocompleteService;
  private Places: any;
  autocomplete: { input: string };
  autocompleteItems: any[];
  private startLat: number;
  private startLng: number;

  private isCity: Boolean;
  autocompleteEnd: { input: string };
  autocompleteItemsEnd: any[];
  private endLat: number;
  private endLng: number;
  notSelected2: Boolean = true;

  autocompleteDestination: { input: string };
   autocompleteDestinations: any[];
  private destLat: number;
  private destLng: number;
   notSelected3: Boolean = true;
  infovalidate = this.fb.group(
    {
      startCity: ["", Validators.required],
      endCity: ["", Validators.required],
      destination: ["", Validators.required],
      startDate: ["", Validators.required],
      startTime: ["", Validators.required],
      endDate: ["", Validators.required],
      endTime: ["", Validators.required],
      travellerCount: ["", Validators.required],
    },
    {
      validator: Validators.compose([
        TripinfoPage.datevalidate("startDate", "endDate", { startDate: true }),
      ]),
    }
  );

  constructor(
    public zone: NgZone,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.GoogleAutocomplete = new google.maps.places.AutocompleteService();
    let map = new google.maps.Map(document.createElement("div"));
    this.Places = new google.maps.places.PlacesService(map);
    this.autocomplete = { input: "" };
    this.autocompleteItems = [];

    this.autocompleteEnd = { input: "" };
    this.autocompleteItemsEnd = [];

    this.autocompleteDestination = { input: "" };
    this.autocompleteDestinations = [];
  }

  private static datevalidate(
    dateField1: string,
    dateField2: string,
    validatorField: { [key: string]: boolean }
  ): ValidatorFn {
    return (c: AbstractControl): { [key: string]: boolean } | null => {
      const date1 = c.get(dateField1).value;
      const date2 = c.get(dateField2).value;
      if (date1 !== null && date2 !== null && date1 > date2) {
        return validatorField;
      }
      return null;
    };
  }

  onSubmit() {

    let navigationExtras: NavigationExtras = {
      state: {
        startCity: this.autocomplete.input,
        endCity: this.autocompleteEnd.input,
        startDate: this.startDate,
        endDate: this.endDate,
        startTime: this.startTime,
        endTime: this.endTime,
        destination: this.autocompleteDestination.input,
        destLat: this.destLat,
        destLng: this.destLng,
        endLat: this.endLat,
        endLng: this.endLng,
        startLat: this.startLat,
        startLng: this.startLng,
        isCity: this.isCity,
        travellerCount: this.travellerCount,
      },
    };
    this.router.navigate(["selection"], navigationExtras).catch((err) => console.log(err));
  }

  ngOnInit() {}

  updateSearchResults() {
    if (this.autocomplete.input == "") {
      this.autocompleteItems = [];
    } else {
      this.GoogleAutocomplete.getPlacePredictions(
        { input: this.autocomplete.input, types: ["(cities)"] },
        (predictions, status) => {
          this.autocompleteItems = [];
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.autocompleteItems.push(prediction);
            });
          });
        }
      );
      this.notSelected = true;
    }
  }

  updateEndSearchResults() {
    if (this.autocompleteEnd.input == "") {
      this.autocompleteItemsEnd = [];
    } else {
      this.GoogleAutocomplete.getPlacePredictions(
        { input: this.autocompleteEnd.input, types: ["(cities)"] },
        (predictions, status) => {
          this.autocompleteItemsEnd = [];
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.autocompleteItemsEnd.push(prediction);
            });
          });
        }
      );
      this.notSelected2 = true;
    }
  }

  updateDestinationResults() {
    if (this.autocompleteDestination.input == "") {
      this.autocompleteDestinations = [];
    } else {
      this.GoogleAutocomplete.getPlacePredictions(
        { input: this.autocompleteDestination.input, types: ["(regions)"] },
        (predictions, status) => {
          this.autocompleteDestinations = [];
          this.zone.run(() => {
            predictions.forEach((prediction) => {
              this.autocompleteDestinations.push(prediction);
            });
          });
        }
      );
      this.notSelected3 = true;
    }
  }

  selectSearchResult(item) {
    this.autocomplete.input = item.description;
    this.getLocation(item, "start");
    this.notSelected = false;
  }

  selectEndSearchResult(item) {
    this.autocompleteEnd.input = item.description;
    this.getLocation(item, "end");
    this.notSelected2 = false;
  }

  selectDestinationResult(item) {
    item.types.find((item) => item === "country")
      ? (this.isCity = false)
      : (this.isCity = true);
    this.autocompleteDestination.input = item.description;

    this.getLocation(item, "destination");

    this.notSelected3 = false;
  }

  getLocation(item: any, type: string) {
    var request = {
      placeId: item.place_id,
    };

    this.Places.getDetails(
      request,
      function (place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          switch (type) {
            case "destination": {
              this.destLat = place.geometry.location.lat();
              this.destLng = place.geometry.location.lng();
              break;
            }
            case "start": {
              this.startLat = place.geometry.location.lat();
              this.startLng = place.geometry.location.lng();
              break;
            }
            case "end": {
              this.endLat = place.geometry.location.lat();
              this.endLng = place.geometry.location.lng();
              break;
            }
            default: {
              break;
            }
          }
        }
      }.bind(this)
    ); // bind to trip info page scope
  }

  hideEndCity() {
    if (this.different) {
      this.different = false;
    } else {
      this.different = true;
    }
  }
}
