import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MyOrdersComponent } from './my-order/my-order.component';
import { DonateComponent } from './donate/donate.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'donate', component: DonateComponent },
  { path: 'my-orders', component: MyOrdersComponent },
  // { path: 'campaigns', component: CampaignsComponent },
  // { path: 'rewards', component: RewardsComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/home' }
];