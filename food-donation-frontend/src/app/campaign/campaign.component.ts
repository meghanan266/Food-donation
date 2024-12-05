import { Component, OnInit } from '@angular/core';
import { CampaignService } from '../services/campaign.service';
import { VolunteerService } from '../services/volunteer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campaign',
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.css'],
})
export class CampaignComponent implements OnInit {
  campaigns: any[] = [];
  volunteers: any[] = [];
  selectedCampaign: any = null;
  isEditing = false;
  isAdding = false;

  newCampaign = {
    name: '',
    goal: 0,
    description: '',
    date: '', // New date field
    volunteers: [], // List of volunteer IDs for the new campaign
  };

  selectedVolunteers: number[] = []; // IDs of volunteers selected for editing
  userId: number | null = null;
  isAdmin = false;

  constructor(
    private readonly campaignService: CampaignService,
    private readonly volunteerService: VolunteerService
  ) { }

  ngOnInit(): void {
    this.userId = parseInt(localStorage.getItem('userId') || '0', 10);
    this.isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (this.isAdmin) {
      this.getCampaigns();
      this.getVolunteers();
    } else {
      this.getAllCampaigns();
    }
  }


  // Fetch all campaigns for non-admin users
  getAllCampaigns(): void {
    this.campaignService.getAllCampaigns().subscribe({
      next: (response) => (this.campaigns = response),
      error: (err) => console.error('Error fetching all campaigns:', err),
    });
  }

  // Add Campaign with Admin Id
  addCampaign() {
    const campaignData = {
      ...this.newCampaign,
      admin_id: this.userId, // Include admin ID from local storage
      volunteers: this.selectedVolunteers, // Include selected volunteers
    };
    this.campaignService.addCampaign(campaignData).subscribe({
      next: () => {
        this.getCampaigns();
        this.resetNewCampaign();
        console.log('Campaign added successfully');
      },
      error: (err) => console.error('Error adding campaign:', err),
    });
  }


  // Fetch Campaigns for Admin
  getCampaigns() {
    if (this.userId) {
      this.campaignService.getCampaignsByAdmin(this.userId).subscribe({
        next: (response) => (this.campaigns = response),
        error: (err) => console.error('Error fetching campaigns:', err),
      });
    }
  }



  // Fetch all volunteers
  getVolunteers() {
    this.volunteerService.getVolunteers().subscribe({
      next: (response) => (this.volunteers = response),
      error: (err) => console.error('Error fetching volunteers:', err),
    });
  }

  // Edit a campaign
  editCampaign(campaign: any) {
    this.isEditing = true;
    this.selectedCampaign = { ...campaign };
    this.selectedVolunteers = campaign.volunteerIds || []; // Initialize selected volunteers
  }

  // Update a campaign
  updateCampaign() {
    if (this.selectedCampaign) {
      const updatedCampaign = {
        ...this.selectedCampaign,
        date: this.selectedCampaign.date,
        volunteers: this.selectedVolunteers, // Include selected volunteers
      };
      this.campaignService.updateCampaign(updatedCampaign).subscribe({
        next: (response) => {
          console.log('Campaign updated:', response);
          this.getCampaigns();
          this.cancelEdit();
        },
        error: (err) => console.error('Error updating campaign:', err),
      });
    }
  }

  // Delete a campaign
  deleteCampaign(campaignId: number) {
    this.campaignService.deleteCampaign(campaignId).subscribe({
      next: (response) => {
        console.log('Campaign deleted:', response);
        this.getCampaigns();
      },
      error: (err) => console.error('Error deleting campaign:', err),
    });
  }

  // Cancel edit mode
  cancelEdit(): void {
    this.isEditing = false;
    this.selectedCampaign = null;
    this.selectedVolunteers = [];
  }

  // Reset new campaign form
  resetNewCampaign(): void {
    this.isAdding = false;
    this.newCampaign = { name: '', goal: 0, description: '', volunteers: [], date: '' };
    this.selectedVolunteers = [];
  }

  // Toggle volunteer selection
  toggleVolunteerSelection(volunteerId: number) {
    const index = this.selectedVolunteers.indexOf(volunteerId);
    if (index > -1) {
      this.selectedVolunteers.splice(index, 1);
    } else {
      this.selectedVolunteers.push(volunteerId);
    }
  }

  // Check if a volunteer is selected
  isVolunteerSelected(volunteerId: number): boolean {
    return this.selectedVolunteers.includes(volunteerId);
  }
}
