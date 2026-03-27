import { Component, ViewContainerRef, inject, AfterViewInit, OnInit, afterNextRender } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { ToastComponent } from '../toast/toast';
import { TrialBannerComponent } from '../trial-banner/trial-banner';
import { ModalService } from '../../services/modal.service';
import { LocationsService } from '../../../features/settings/services/locations.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { NavigationStateService } from '../../../core/services/navigation-state.service';
import { EntitlementService } from '../../../core/services/entitlement.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, HeaderComponent, ToastComponent, TrialBannerComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements OnInit {
  private vcr = inject(ViewContainerRef);
  private modalService = inject(ModalService);
  private locationsService = inject(LocationsService);
  private navigationState = inject(NavigationStateService);
  private entitlementService = inject(EntitlementService);
  sidebarState = inject(SidebarStateService);

  constructor() {
    // ON-BUG-003: usar afterNextRender en lugar de ngAfterViewInit para registrar el ViewContainerRef.
    // En apps zoneless, actualizar estado en ngAfterViewInit puede causar NG0100 porque
    // la vista ya fue chequeada. afterNextRender garantiza que el registro ocurre
    // después del primer ciclo de renderizado completo.
    afterNextRender(() => {
      this.modalService.registerViewContainerRef(this.vcr);
    });
  }

  ngOnInit(): void {
    this.locationsService.getSummaries().subscribe();
    this.navigationState.startTracking();
    if (!this.entitlementService.loaded()) {
      this.entitlementService.loadEntitlements();
    }
  }
}
