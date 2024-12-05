import { Component, OnInit } from '@angular/core';
import { FoodService } from '../services/food.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback',
  imports: [CommonModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {
  feedbacks: any[] = [];
  errorMessage: string = '';

  constructor(private foodservice: FoodService) { }

  ngOnInit(): void {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      console.error('Access denied: Only admins can view feedback.');
      return;
    }
    this.fetchFeedbacks();
  }


  fetchFeedbacks(): void {
    this.foodservice.getAllFeedback().subscribe({
      next: (response) => {
        this.feedbacks = response;
      },
      error: (error) => {
        console.error('Error fetching feedback:', error);
        this.errorMessage = 'Failed to load feedback.';
      },
    });
  }
}