import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Table } from '../models/table.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7252/api/tables'; // cambia porta se la tua è diversa

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }
}
