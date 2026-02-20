import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReportsService } from '../../services/reports.service';
import { AccountsReceivableItem, AccountsReceivableSummary } from '../../models/report.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent],
  templateUrl: './accounts-receivable.html',
  styleUrl: './accounts-receivable.scss'
})
export class AccountsReceivableComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private router = inject(Router);

  items = signal<AccountsReceivableItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filters
  minDaysOverdue = signal<number | null>(null);
  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let data = this.items();
    if (term) {
      data = data.filter(item =>
        item.patientName.toLowerCase().includes(term) ||
        (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(term))
      );
    }
    return data;
  });

  summary = computed<AccountsReceivableSummary>(() => {
    const items = this.filteredItems();
    return {
      totalBalance: items.reduce((sum, i) => sum + i.balance, 0),
      totalOverdue: items.filter(i => i.daysOverdue > 0).reduce((sum, i) => sum + i.balance, 0),
      totalInvoices: items.length,
      overdueInvoices: items.filter(i => i.daysOverdue > 0).length
    };
  });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => this.searchTerm.set(term));

    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reportsService.getAccountsReceivable(
      undefined,
      this.minDaysOverdue() || undefined
    ).subscribe({
      next: (data) => {
        const parsed = data.map(item => ({
          ...item,
          issuedAt: new Date(item.issuedAt),
          lastPaymentDate: item.lastPaymentDate ? new Date(item.lastPaymentDate) : undefined
        }));
        parsed.sort((a, b) => b.daysOverdue - a.daysOverdue);
        this.items.set(parsed);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el reporte de cuentas por cobrar.');
        this.loading.set(false);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  applyDaysFilter(days: number | null): void {
    this.minDaysOverdue.set(days);
    this.loadData();
  }

  goToInvoice(invoiceId: string): void {
    this.router.navigate(['/invoices', invoiceId]);
  }

  goToPatient(patientId: string): void {
    this.router.navigate(['/patients', patientId]);
  }

  getOverdueClass(days: number): string {
    if (days > 60) return 'overdue-critical';
    if (days > 30) return 'overdue-high';
    if (days > 0) return 'overdue-warning';
    return '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }
}
