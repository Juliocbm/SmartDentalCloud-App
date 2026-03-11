import { Component, ViewContainerRef, inject, AfterViewInit, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { ToastComponent } from '../toast/toast';
import { ModalService } from '../../services/modal.service';
import { LocationsService } from '../../../features/settings/services/locations.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { NavigationStateService } from '../../../core/services/navigation-state.service';
import { FeatureService } from '../../../core/services/feature.service';
import { SubscriptionsService } from '../../../features/subscriptions/services/subscriptions.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, HeaderComponent, ToastComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  private vcr = inject(ViewContainerRef);
  private modalService = inject(ModalService);
  private locationsService = inject(LocationsService);
  private navigationState = inject(NavigationStateService);
  private featureService = inject(FeatureService);
  private subscriptionsService = inject(SubscriptionsService);
  sidebarState = inject(SidebarStateService);

  ngOnInit(): void {
    this.locationsService.getSummaries().subscribe();
    this.navigationState.startTracking();
    this.loadFeatures();
  }

  private loadFeatures(): void {
    this.subscriptionsService.getCurrent().subscribe({
      next: (sub) => this.featureService.loadFromPlanName(sub.planName),
      error: () => this.featureService.loadFromPlanName('')
    });
  }

  ngAfterViewInit(): void {
    this.modalService.registerViewContainerRef(this.vcr);
  }
}
