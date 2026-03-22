import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Table } from '../models/table.model';
import { CreateTableRequest } from '../models/create-table-request.model';
import { SeatRequest } from '../models/seat-request.model';
import { LeaveRequest } from '../models/leave-request.model';
import { AssignTableRequest } from '../models/assign-table-request.model';
import { AssignTableResponse } from '../models/assign-table-response.model';
import { SplitSeatRequest } from '../models/split-seat-request.model';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7252/api/tables';

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(this.apiUrl);
  }

  createTable(request: CreateTableRequest): Observable<Table> {
    return this.http.post<Table>(this.apiUrl, request);
  }

  deleteTable(tableId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tableId}`);
  }

  seatPeople(request: SeatRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/seat`, request);
  }

  leavePeople(request: LeaveRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/leave`, request);
  }

  assignTable(request: AssignTableRequest): Observable<AssignTableResponse> {
    return this.http.post<AssignTableResponse>(`${this.apiUrl}/assign`, request);
  }

  seatSplit(request: SplitSeatRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/seat-split`, request);
  }
}
