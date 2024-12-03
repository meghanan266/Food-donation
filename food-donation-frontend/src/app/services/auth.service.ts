import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from '../models/AuthResponse';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly baseUrl = 'http://127.0.0.1:5000/api'; // Flask API base URL

    constructor(private readonly http: HttpClient) { }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password });
    }

    signup(user: any): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, user, {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
