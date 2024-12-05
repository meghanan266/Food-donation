import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = 'http://127.0.0.1:5000/api';

  constructor(private readonly http: HttpClient) {}

  // Get all users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  // Delete a user
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${userId}`);
  }

  getUserRewards(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/rewards/${userId}`);
  }
}
