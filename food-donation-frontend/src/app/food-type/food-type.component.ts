import { Component, OnInit } from '@angular/core';
import { FoodTypeService } from '../services/food-type-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-food-type',
  imports: [CommonModule, FormsModule],
  templateUrl: './food-type.component.html',
  styleUrl: './food-type.component.css'
})
export class FoodTypeComponent implements OnInit {
  foodTypes: any[] = [];
  newFoodType: string = '';
  editingTypeId: number | null = null;

  constructor(private readonly foodTypeService: FoodTypeService) {}

  ngOnInit(): void {
    this.getFoodTypes();
  }

  getFoodTypes() {
    this.foodTypeService.getFoodTypes().subscribe({
      next: (response) => (this.foodTypes = response),
      error: (err) => console.error('Error fetching food types:', err),
    });
  }

  addFoodType() {
    if (!this.newFoodType.trim()) return;
    this.foodTypeService.addFoodType(this.newFoodType).subscribe({
      next: (response) => {
        console.log('Food type added:', response);
        this.newFoodType = '';
        this.getFoodTypes();
      },
      error: (err) => console.error('Error adding food type:', err),
    });
  }

  editFoodType(foodType: any) {
    this.editingTypeId = foodType.Type_Id;
  }

  isEditing(typeId: number): boolean {
    return this.editingTypeId === typeId;
  }

  cancelEdit() {
    this.editingTypeId = null;
    this.getFoodTypes(); // Reset edited values
  }

  updateFoodType(foodType: any) {
    this.foodTypeService.updateFoodType(foodType).subscribe({
      next: (response) => {
        console.log('Food type updated:', response);
        this.editingTypeId = null;
        this.getFoodTypes();
      },
      error: (err) => console.error('Error updating food type:', err),
    });
  }

  deleteFoodType(typeId: number) {
    if (confirm('Are you sure you want to delete this food type?')) {
      this.foodTypeService.deleteFoodType(typeId).subscribe({
        next: (response) => {
          console.log('Food type deleted:', response);
          this.getFoodTypes();
        },
        error: (err) => console.error('Error deleting food type:', err),
      });
    }
  }
}