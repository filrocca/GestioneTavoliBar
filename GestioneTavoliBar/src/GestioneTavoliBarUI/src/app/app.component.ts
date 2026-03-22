import { Component } from '@angular/core';
import { TablesComponent } from './components/tables/tables.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TablesComponent],
  template: `<app-tables></app-tables>`
})
export class AppComponent { }
