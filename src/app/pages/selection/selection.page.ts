import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormGroup,
  FormBuilder,
  Validators,
  ValidatorFn,
  FormControl,
} from "@angular/forms";
import { Trip } from "../../interfaces/trip";
import { TripService } from "../../services/trip.service";
@Component({
  selector: "app-selection",
  templateUrl: "./selection.page.html",
  styleUrls: ["./selection.page.scss"],
})
export class SelectionPage implements OnInit {
  // initialise the trip interface instance
  trip = {} as Trip;

  public allowance = [
    { val: "Budget", isChecked: false },
    { val: "Flexible", isChecked: false },
    { val: "Luxury", isChecked: false },
  ];

  public travellers = [
    { val: "Children", isChecked: false },
    { val: "People with disabilities", isChecked: false },
    { val: "Athletes", isChecked: false },
    { val: "Elderly", isChecked: false },
    { val: "Businessmen", isChecked: false },
    { val: "Ill people", isChecked: false },
    { val: "None of the above", isChecked: false },
  ];

  public travelTypes = [
    { val: "Plane", isChecked: false },
    { val: "Bus", isChecked: false },
    { val: "Train", isChecked: false },
  ];

  public diet = [
    { val: "Vegan", isChecked: false },
    { val: "Vegetarian", isChecked: false },
    { val: "Gluten-free", isChecked: false },
    { val: "No preferences", isChecked: false },
  ];

  public pace = [
    { val: "Relaxed", isChecked: false },
    { val: "Flexible", isChecked: false },
    { val: "Fast-paced", isChecked: false },
  ];

  public preferences = [
    { val: "Popular", isChecked: false },
    { val: "Balanced", isChecked: false },
    { val: "Hidden gems", isChecked: false },
  ];

  // checkboxed interest list
  public interests = [
    { val: "Culture", isChecked: false },
    { val: "Museums", isChecked: false },
    { val: "Sports", isChecked: false },
    { val: "Shopping", isChecked: false },
    { val: "Beaches", isChecked: false },
    { val: "Romantic", isChecked: false },
    { val: "Food", isChecked: false },
    { val: "Outdoors", isChecked: false },
    { val: "Events", isChecked: false },
    { val: "Wildlife", isChecked: false },
  ];

  infovalidate: FormGroup;

  constructor(
    private tripService: TripService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log("error is here");
    this.route.queryParams.subscribe((params) => {
      console.log("i dont see this");
      if (this.router.getCurrentNavigation().extras.state) {
        let state = this.router.getCurrentNavigation().extras.state;
        this.trip.destination = {
          name: state.destination,
          isCity: state.isCity,
          lat: state.destLat,
          lng: state.destLng,
        };
        this.trip.endCity = {
          name: state.endCity,
          lat: state.endLat,
          lng: state.endLng,
        };
        this.trip.startCity = {
          name: state.startCity,
          lat: state.startLat,
          lng: state.startLng,
        };
        this.trip.startDate = state.startDate;
        this.trip.endDate = state.endDate;
        this.trip.startTime = state.startTime;
        this.trip.endTime = state.endTime;
        this.trip.travellerCount = state.travellerCount;
        console.log(this.trip);
      }
    }).add((err)=> console.log(err));

    this.infovalidate = new FormGroup({
      tripAllowance: new FormControl("", Validators.required),
      travelGroup: new FormControl("", Validators.required),
      diet: new FormControl("", Validators.required),
      pace: new FormControl("", Validators.required),
      preferredActivity: new FormControl("", Validators.required),
      meansOfTravel: new FormControl("", Validators.required),

      myInterestsGroup: new FormGroup(
        {
          Culture: new FormControl(false),
          Museums: new FormControl(false),
          Sports: new FormControl(false),
          Shopping: new FormControl(false),
          Beaches: new FormControl(false),
          Romantic: new FormControl(false),
          Food: new FormControl(false),
          Outdoors: new FormControl(false),
          Events: new FormControl(false),
          Wildlife: new FormControl(false),
        },
        this.requireCheckboxesToBeCheckedValidator()
      ),
    });
  }

  ngOnInit() {}

  /*
    create the trip object based on form input
    send it to the trip generation service
  */
  onSubmit() {
    this.trip.interests = [];
    Object.keys(this.infovalidate.controls).forEach((key) => {
      if (key == "myInterestsGroup") {
        let temp = this.infovalidate.get(key).value;
        Object.keys(temp).forEach((id) => {
          if(temp[id])
          {
            this.trip.interests.push(id);
          }      
        });
      } else {
        let item = this.infovalidate.controls[key].value;
        switch (key) {
          case "tripAllowance":
            this.trip.allowance = item;
            break;
          case "travelGroup":
            this.trip.travellerType = item;
            break;
          case "diet":
            this.trip.diet = item;
            break;
          case "pace":
            this.trip.pace = item;
            break;
          case "preferredActivity":
            this.trip.preferredActivities = item;
            break;
          case "meansOfTravel":
            this.trip.preferredTransport = item;
            break;
          default:
            break;
        }
      }
    });

    //save n run
    this.tripService.generateTrip(this.trip);
    console.log(this.trip);
  }

  requireCheckboxesToBeCheckedValidator(minRequired = 1): ValidatorFn {
    return function validate(formGroup: FormGroup) {
      let checked = 0;

      Object.keys(formGroup.controls).forEach((key) => {
        const control = formGroup.controls[key];

        if (control.value === true) {
          checked++;
        }
      });

      if (checked < minRequired) {
        return {
          requireCheckboxesToBeChecked: true,
        };
      }

      return null;
    };
  }
}
