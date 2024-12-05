import { Component, OnInit } from '@angular/core';
import { VolunteerService } from '../services/volunteer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-volunteer',
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteer.component.html',
  styleUrl: './volunteer.component.css'
})
export class VolunteerComponent implements OnInit {
  volunteers: any[] = [];
  selectedVolunteer: any = null;
  isEditing = false;

  newVolunteer = {
    name: '',
    email: '',
    phone_number: '',
    availability: '',
  };

  constructor(private readonly volunteerService: VolunteerService) {}

  ngOnInit(): void {
    this.getVolunteers();
  }

  getVolunteers() {
    this.volunteerService.getVolunteers().subscribe({
      next: (response) => (this.volunteers = response),
      error: (err) => console.error('Error fetching volunteers:', err),
    });
  }

  addVolunteer() {
    this.volunteerService.addVolunteer(this.newVolunteer).subscribe({
      next: (response) => {
        console.log('Volunteer added:', response);
        this.getVolunteers();
        this.newVolunteer = { name: '', email: '', phone_number: '', availability: '' };
      },
      error: (err) => console.error('Error adding volunteer:', err),
    });
  }

  editVolunteer(volunteer: any) {
    this.isEditing = true;
    this.selectedVolunteer = { ...volunteer };
  }

  updateVolunteer() {
    if (this.selectedVolunteer) {
      this.volunteerService.updateVolunteer(this.selectedVolunteer).subscribe({
        next: (response) => {
          console.log('Volunteer updated:', response);
          this.getVolunteers();
          this.isEditing = false;
          this.selectedVolunteer = null;
        },
        error: (err) => console.error('Error updating volunteer:', err),
      });
    }
  }

  deleteVolunteer(volunteerId: number) {
    this.volunteerService.deleteVolunteer(volunteerId).subscribe({
      next: (response) => {
        console.log('Volunteer deleted:', response);
        this.getVolunteers();
      },
      error: (err) => console.error('Error deleting volunteer:', err),
    });
  }
}