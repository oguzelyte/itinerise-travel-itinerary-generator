import { Component,OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { AuthenticationService } from "../../services/shared/authentication.service";
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  
  constructor(
    public authService: AuthenticationService,
    public router: Router,
    public toast: ToastController
  ) {
    
  }

  ngOnInit() {}

  // create toast
  async presentToast(msg: string) {
    const toast = await this.toast.create({
      message: msg,
      duration: 3000
    });
    toast.present();
  }

  // log in. present toast on success or error
  // navigate to home
  logIn(email, password) {
    this.authService.SignIn(email.value, password.value)
      .then((res) => {
        if(res.user.emailVerified) {
          this.presentToast("You have successfully logged in.");      
          this.router.navigate(['tabs/home']);
        } else {
          this.presentToast('Email is not verified');
          return false;
        }
      }).catch((error) => {
        this.presentToast(error.message);
      })
  }

  // navigate to registration
  navigateToRegistration(){
    this.router.navigate(['tabs/registration']);  
  }

}
