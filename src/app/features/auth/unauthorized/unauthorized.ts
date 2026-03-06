import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.scss'
})
export class UnauthorizedComponent {}
