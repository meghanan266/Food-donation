import { Component, OnInit } from '@angular/core';
import { FoodService } from '../services/food.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  foodPosts: any[] = []; // Store food posts here
  errorMessage: string = '';
  selectedPost: any;
  isAdmin = false;

  constructor(private foodPostService: FoodService, private router: Router) { }

  ngOnInit(): void {
    this.isAdmin = localStorage.getItem('isAdmin') === 'true';
    this.fetchFoodPosts();
  }

  fetchFoodPosts(): void {
    this.foodPostService.getNonExpiredFoodPosts().subscribe({
      next: (response) => {
        this.foodPosts = response;
        console.log('Food posts fetched:', this.foodPosts);
      },
      error: (error) => {
        console.error('Error fetching food posts:', error);
        this.errorMessage = 'Failed to load food posts. Please try again later.';
      },
    });
  }

  openOrderModal(post: any): void {
    this.selectedPost = post;
  }

  closeModal(): void {
    this.selectedPost = null;
  }

  placeOrder(form: any): void {
    const pickupDetails = form.value;

    const recipientId = localStorage.getItem('userId');
    if (!recipientId) {
      alert('User not logged in. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const orderData = {
      Food_Post_Id: this.selectedPost.Food_Post_Id,
      Pickup_Time: pickupDetails.time,
      Special_Instructions: pickupDetails.instructions,
      Recipient_Id: recipientId,
    };

    console.log('Placing order:', orderData);
    // Call the service to place the order
    this.foodPostService.placeOrder(orderData).subscribe({
      next: (response) => {
        alert('Order placed successfully!');
        this.closeModal();
        this.fetchFoodPosts(); // Refresh posts to update status
      },
      error: (error) => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      },
    });
  }
}
