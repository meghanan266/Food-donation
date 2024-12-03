import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FoodService } from '../services/food.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-donate',
  imports: [CommonModule, FormsModule],
  templateUrl: './donate.component.html',
  styleUrl: './donate.component.css'
})
export class DonateComponent {
  constructor(private foodPostService: FoodService) {}

  onDonate(formData: any): void {
    const donorId = localStorage.getItem('userId'); // Get logged-in user ID
    if (!donorId) {
      alert('You must be logged in to donate.');
      return;
    }

    const donationData = {
      Food_Type_Id: formData.foodType,
      Donor_Id: donorId,
      Quantity: formData.quantity,
      Expiration_Date: formData.expirationDate,
      Description: formData.description,
      Status: 'Available'
    };

    this.foodPostService.createFoodPost(donationData).subscribe({
      next: (response) => {
        alert('Thank you for your donation!');
      },
      error: (error) => {
        console.error('Error donating food:', error);
        alert('Failed to submit your donation. Please try again.');
      }
    });
  }
}
