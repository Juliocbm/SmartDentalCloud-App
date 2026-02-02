import { Component, ViewContainerRef, inject, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class LayoutComponent implements AfterViewInit {
  private vcr = inject(ViewContainerRef);
  private modalService = inject(ModalService);

  ngAfterViewInit(): void {
    this.modalService.registerViewContainerRef(this.vcr);
  }
}
