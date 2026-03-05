import { Component, input, output, signal, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Cie10Service, Cie10Code } from '../../../core/services/cie10.service';

@Component({
  selector: 'app-cie10-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cie10-autocomplete.html',
  styleUrl: './cie10-autocomplete.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class Cie10AutocompleteComponent implements OnInit, OnDestroy {
  private cie10Service = inject(Cie10Service);
  private elementRef = inject(ElementRef);

  selectedCode = input<string | null>(null);
  codeSelected = output<Cie10Code | null>();

  searchTerm = signal('');
  results = signal<Cie10Code[]>([]);
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
      switchMap(term => this.cie10Service.search(term))
    ).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
        this.showDropdown.set(results.length > 0);
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

  selectCode(code: Cie10Code): void {
    this.selectedDisplay.set(`${code.code} — ${code.description}`);
    this.searchTerm.set('');
    this.showDropdown.set(false);
    this.results.set([]);
    this.codeSelected.emit(code);
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
