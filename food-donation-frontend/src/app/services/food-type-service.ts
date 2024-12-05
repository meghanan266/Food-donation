import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FoodTypeService {
  private readonly baseUrl = 'http://127.0.0.1:5000/api';

  constructor(private readonly http: HttpClient) {}

  getFoodTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/food-types`);
  }

  addFoodType(name: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/food-types`, { Type_Name: name });
  }

  updateFoodType(foodType: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/food-types/${foodType.Type_Id}`, foodType);
  }

  deleteFoodType(typeId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/food-types/${typeId}`);
  }
}
