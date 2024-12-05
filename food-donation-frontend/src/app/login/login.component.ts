import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isSignup = false;
  isAdmin = false; // Default to user
  errorMessage: string | null = null;
  constructor(private readonly authService: AuthService, private router: Router) { }

  toggleForm() {
    this.isSignup = !this.isSignup;
    this.errorMessage = null;
  }

  onLogin(formData: any) {
    const endpoint = this.isAdmin
      ? this.authService.adminLogin(formData.value.email, formData.value.password) // Admin login
      : this.authService.login(formData.value.email, formData.value.password); // User login

    endpoint.subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        localStorage.setItem('userId', response.id); 
        localStorage.setItem('isAdmin', response.isAdmin); 
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = 'Invalid email or password. Please try again.';
      },
    });
  }

  onSignup(formData: any) {
    const payload = {
      name: formData.value.name,
      email: formData.value.email,
      password: formData.value.password,
      ...(this.isAdmin ? {} : { phone_number: formData.value.phone_number }), // Include phone for users only
    };

    const endpoint = this.isAdmin
      ? this.authService.adminSignup(payload) // Admin signup
      : this.authService.signup(payload); // User signup

    endpoint.subscribe({
      next: (response: any) => {
        console.log('Signup successful:', response);
        localStorage.setItem('userId', response.id); // Adjust based on API response
        location.reload();
      },
      error: (err) => {
        console.error('Signup failed:', err);
        if (err.status === 409) {
          this.errorMessage = 'User already exists. Please log in.';
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
      },
    });
  }
}
