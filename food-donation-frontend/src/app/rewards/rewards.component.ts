import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rewards',
  imports: [CommonModule],
  templateUrl: './rewards.component.html',
  styleUrl: './rewards.component.css'
})
export class RewardsComponent implements OnInit {
  points: number = 0;
  tierName: string = '';
  badgeUrl: string = '';
  nextTierName: string = '';
  nextTierPoints: number = 0;

  constructor(private readonly userService: UserService) { }

  ngOnInit(): void {
    this.getRewards();
  }

  getRewards() {
    const userId = localStorage.getItem('userId'); // Assuming userId is stored in localStorage
    if (!userId) {
      console.error('User ID not found.');
      return;
    }

    this.userService.getUserRewards(+userId).subscribe({
      next: (response) => {
        this.points = response.Points_Accumulated;
        this.tierName = response.Tier_Name;

        // Assign badge URL based on tier
        this.badgeUrl = this.getBadgeUrl(this.tierName);

        // Calculate points required for the next tier
        if (response.Next_Tier) {
          this.nextTierName = response.Next_Tier.Tier_Name;
          this.nextTierPoints = response.Next_Tier.Min_Points - this.points;
        }
      },
      error: (err) => console.error('Error fetching rewards:', err),
    });
  }

  getBadgeUrl(tierName: string): string {
    const badges: { [key: string]: string } = {
      Bronze: 'assets/bronze.png',
      Silver: 'assets/silver.png',
      Gold: 'assets/gold.png',
      Platinum: 'assets/platinum.png',
    };
  
    return badges[tierName] || 'assets/default-badge.png';
  }
  
}