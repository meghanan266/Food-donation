import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FoodService {
    private baseUrl = 'http://127.0.0.1:5000/api';

    constructor(private http: HttpClient) { }

    // Fetch non-expired food posts
    getNonExpiredFoodPosts(): Observable<any> {
        return this.http.get(`${this.baseUrl}/food-posts`);
    }

    placeOrder(orderData: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/place-order`, orderData);
    }

    getUserOrders(userId: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/my-orders/${userId}`);
    }

    createFoodPost(donationData: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/donate`, donationData);
    }

    addFeedback(feedbackData: { donationId: number; rating: number; comments: string }): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/feedback`, feedbackData, {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
}
