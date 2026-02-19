import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

/**
 * Componente placeholder para módulos aún no implementados.
 * Muestra un mensaje "Próximamente" con el nombre del módulo.
 * Lee moduleName e icon desde route data.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComingSoonComponent implements OnInit {
  private route = inject(ActivatedRoute);

  moduleName = signal('Este módulo');
  icon = signal('fa-clock');

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    if (data['moduleName']) this.moduleName.set(data['moduleName']);
    if (data['icon']) this.icon.set(data['icon']);
  }
}
