import { Component } from "@angular/core";
import { AuthenticationService } from "../../services/shared/authentication.service";
import { DbOperationsService } from "../../services/shared/db-operations.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage {
  displayName: string;

  constructor(
    public authService: AuthenticationService,
    private dbOp: DbOperationsService,
    private router: ActivatedRoute
  ) {}

  // display either display name or welcome message
  ngOnInit() {
    this.router.paramMap.subscribe((params) => {
      console.log("logged in");
      if (this.dbOp.getUser() != undefined) {
        this.dbOp.getUser().subscribe((user) => {
          this.displayName = user.data()["displayName"];
        });
      }
    });
  }
}
