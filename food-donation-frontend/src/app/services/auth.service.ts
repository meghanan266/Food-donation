import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthResponse } from '../models/AuthResponse';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'http://127.0.0.1:5000/api'; // Flask API base URL
 // BehaviorSubjects for login state
 private isLoggedInSubject = new BehaviorSubject<boolean>(false);
 private isAdminSubject = new BehaviorSubject<boolean>(false);

 // Public observables for components to subscribe to
 isLoggedIn$ = this.isLoggedInSubject.asObservable();
 isAdmin$ = this.isAdminSubject.asObservable();
  constructor(private readonly http: HttpClient) { }

  login(email: string, password: string): Observable<AuthResponse> {
    return new Observable((observer) => {
      this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).subscribe({
        next: (response: any) => {
          this.isLoggedInSubject.next(true); // Notify login state
          this.isAdminSubject.next(false); // User is not admin
          observer.next(response);
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }

  // User Signup
  signup(user: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, user, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin Login
  adminLogin(email: string, password: string): Observable<AuthResponse> {
    return new Observable((observer) => {
      this.http.post<AuthResponse>(`${this.baseUrl}/admin/login`, { email, password }).subscribe({
        next: (response: any) => {
          this.isLoggedInSubject.next(true); // Notify login state
          this.isAdminSubject.next(true); // User is admin
          observer.next(response);
        },
        error: (err) => {
          observer.error(err);
        },
      });
    });
  }

  // Admin Signup
  adminSignup(admin: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/admin/signup`, admin, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
