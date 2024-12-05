import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private readonly baseUrl = 'http://127.0.0.1:5000/api'; // Flask API base URL

  constructor(private readonly http: HttpClient) { }

  // Get campaigns by Admin
  getCampaignsByAdmin(adminId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/campaigns/${adminId}`);
  }


  // Add a new campaign
  addCampaign(campaign: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/campaigns`, campaign, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update a campaign
  updateCampaign(campaign: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/campaigns/${campaign.id}`, campaign, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Delete a campaign
  deleteCampaign(campaignId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/campaigns/${campaignId}`);
  }

  // Get volunteers assigned to a specific campaign
  getVolunteersByCampaign(campaignId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaigns/${campaignId}/volunteers`);
  }

  // Assign volunteers to a campaign
  assignVolunteers(campaignId: number, volunteerIds: number[]): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/campaigns/${campaignId}/volunteers`,
      { volunteers: volunteerIds },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  getAllCampaigns(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/campaigns`);
  }

}
