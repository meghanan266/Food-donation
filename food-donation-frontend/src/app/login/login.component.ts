import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/AuthResponse';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  isSignup = false;

  constructor(private readonly authService: AuthService, private router: Router) { }

  toggleForm() {
    this.isSignup = !this.isSignup;
  }

  onLogin(formData: any) {
    this.authService.login(formData.value.email, formData.value.password).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response)
        localStorage.setItem('userId', response.user.User_Id.toString());
        this.router.navigate(['/home']);
      },
      error: (err) => console.error('Login failed:', err),
    });
  }

  onSignup(formData: any) {
    this.authService.signup(formData.value).subscribe({
      next: (response: any) => {
        console.log('Signup successful:', response)
        localStorage.setItem('userId', response.User_Id.toString());
        this.router.navigate(['/home']);
      },
      error: (err) => console.error('Signup failed:', err),
    });
  }
}
