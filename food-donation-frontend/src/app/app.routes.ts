import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MyOrdersComponent } from './my-order/my-order.component';
import { DonateComponent } from './donate/donate.component';
import { VolunteerComponent } from './volunteer/volunteer.component';
import { CampaignComponent } from './campaign/campaign.component';
import { UserComponent } from './user/user.component';
import { FoodTypeComponent } from './food-type/food-type.component';
import { RewardsComponent } from './rewards/rewards.component';

export const routes: Routes = [
  { path: 'volunteers', component: VolunteerComponent },
  { path: 'food-type', component: FoodTypeComponent },
  { path: 'users', component: UserComponent },
  { path: 'campaign', component: CampaignComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'donate', component: DonateComponent },
  { path: 'my-orders', component: MyOrdersComponent },
  { path: 'rewards', component: RewardsComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' },
];