import { Component, OnInit } from '@angular/core';
import { FoodService } from '../services/food.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-order',
  imports: [CommonModule],
  templateUrl: './my-order.component.html',
  styleUrl: './my-order.component.css'
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  errorMessage: string = '';

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
}