import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { AuthenticationService } from '../../services/shared/authentication.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
})
export class RegistrationPage implements OnInit {

  constructor(
    public authService: AuthenticationService,
    public router: Router,
    public toast: ToastController
  ) { }

  ngOnInit(){}


  // present toast on error or success
  async presentToast(msg: string) {
    const toast = await this.toast.create({
      message: msg,
      duration: 3000
    });
    toast.present();
  }

  // sign up, navigate to verification page
  signUp(email, password, displayName){
    this.authService.RegisterUser(email.value, password.value, displayName.value)
    .then((res) => {
      this.authService.SendVerificationMail()
      this.router.navigate(['/../../tabs/verify-email']);
      this.presentToast("You have been registered.");
    }).catch((error) => {
      this.presentToast(error.message);
    })
}

}
