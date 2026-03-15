import { Component, input, output, signal, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { SatCatalogoService, SatClaveProdServ, SatClaveUnidad } from '../../../core/services/sat-catalogo.service';

export type SatCatalogoType = 'claveProdServ' | 'claveUnidad';

export interface SatClaveItem {
  clave: string;
  descripcion: string;
  isDental?: boolean;
}

@Component({
  selector: 'app-sat-clave-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sat-clave-autocomplete.html',
  styleUrl: './sat-clave-autocomplete.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class SatClaveAutocompleteComponent implements OnInit, OnDestroy {
  private satCatalogoService = inject(SatCatalogoService);
  private elementRef = inject(ElementRef);

  catalogType = input<SatCatalogoType>('claveProdServ');
  selectedCode = input<string | null>(null);
  placeholder = input<string>('Buscar clave SAT...');
  dentalOnly = input<boolean>(false);

  codeSelected = output<SatClaveItem | null>();

  searchTerm = signal('');
  results = signal<SatClaveItem[]>([]);
  showDropdown = signal(false);
  loading = signal(false);
  selectedDisplay = signal('');

  private searchSubject = new Subject<string>();
  private subscription?: Subscription;

  ngOnInit(): void {
    const code = this.selectedCode();
    if (code) {
      this.selectedDisplay.set(code);
    }

    this.subscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(term => {
        if (this.catalogType() === 'claveUnidad') {
          return this.satCatalogoService.searchClaveUnidad(term);
        }
        return this.satCatalogoService.searchClaveProdServ(term, this.dentalOnly());
      })
    ).subscribe({
      next: (results) => {
        const items: SatClaveItem[] = results.map((r: SatClaveProdServ | SatClaveUnidad) => ({
          clave: r.clave,
          descripcion: 'descripcion' in r && r.descripcion ? r.descripcion : (r as SatClaveUnidad).nombre ?? r.clave,
          isDental: 'isDental' in r ? (r as SatClaveProdServ).isDental : undefined
        }));
        this.results.set(items);
        this.loading.set(false);
        this.showDropdown.set(items.length > 0);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (value.trim().length >= 2) {
      this.searchSubject.next(value.trim());
    } else {
      this.results.set([]);
      this.showDropdown.set(false);
    }
  }

  selectCode(item: SatClaveItem): void {
    this.selectedDisplay.set(`${item.clave} — ${item.descripcion}`);
    this.searchTerm.set('');
    this.showDropdown.set(false);
    this.results.set([]);
    this.codeSelected.emit(item);
  }

  clearSelection(): void {
    this.selectedDisplay.set('');
    this.searchTerm.set('');
    this.results.set([]);
    this.showDropdown.set(false);
    this.codeSelected.emit(null);
  }

  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  onFocus(): void {
    const term = this.searchTerm();
    if (term.trim().length >= 2 && this.results().length > 0) {
      this.showDropdown.set(true);
    }
  }
}
