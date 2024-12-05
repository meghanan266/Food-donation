import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VolunteerService {
  private readonly baseUrl = 'http://127.0.0.1:5000/api/volunteers';

  constructor(private readonly http: HttpClient) {}

  getVolunteers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  addVolunteer(volunteer: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, volunteer);
  }

  updateVolunteer(volunteer: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${volunteer.Volunteer_Id}`, volunteer);
  }

  deleteVolunteer(volunteerId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${volunteerId}`);
  }
}
