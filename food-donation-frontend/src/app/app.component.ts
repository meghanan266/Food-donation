import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
    });

    // Subscribe to admin state
    this.authService.isAdmin$.subscribe((admin) => {
      this.isAdmin = admin;
    });

    this.updateUserStatus();
  }

  updateUserStatus() {
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    this.isLoggedIn = !!userId;
    this.isAdmin = isAdmin;
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.router.navigate(['/login']);
  }
}
