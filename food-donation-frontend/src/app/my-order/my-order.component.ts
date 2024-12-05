import { Component, OnInit } from '@angular/core';
import { FoodService } from '../services/food.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-order',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-order.component.html',
  styleUrls: ['./my-order.component.css'],
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  errorMessage: string = '';
  showFeedbackPopup: boolean = false;
  feedback: { rating: number; comments: string } = { rating: 0, comments: '' };
  selectedOrderId: number | null = null;

  constructor(private foodPostService: FoodService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    const userId = localStorage.getItem('userId'); // Get UserId from localStorage
    if (!userId) {
      this.errorMessage = 'User not logged in.';
      return;
    }

    this.foodPostService.getUserOrders(+userId).subscribe({
      next: (response) => {
        this.orders = response;
        console.log('User orders fetched:', this.orders);
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.errorMessage = 'Failed to load orders. Please try again later.';
      },
    });
  }

  openFeedbackPopup(orderId: number): void {
    this.selectedOrderId = orderId;
    this.feedback = { rating: 0, comments: '' }; // Reset feedback fields
    this.showFeedbackPopup = true;
  }

  closeFeedbackPopup(): void {
    this.showFeedbackPopup = false;
    this.selectedOrderId = null;
    this.feedback = { rating: 0, comments: '' };
  }

  submitFeedback(): void {
    if (!this.feedback.rating || !this.selectedOrderId) return;

    const feedbackData = {
      donationId: this.selectedOrderId,
      rating: this.feedback.rating,
      comments: this.feedback.comments,
    };

    this.foodPostService.addFeedback(feedbackData).subscribe({
      next: () => {
        console.log('Feedback submitted successfully.');
        this.closeFeedbackPopup();
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
      },
    });
  }
}
