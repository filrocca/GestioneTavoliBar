import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table } from '../../models/table.model';
import { TableService } from '../../services/table.service';
import { AssignTableResponse } from '../../models/assign-table-response.model';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables.component.html',
  styleUrl: './tables.component.css'
})
export class TablesComponent implements OnInit {
  private tableService = inject(TableService);

  tables = signal<Table[]>([]);
  loading = signal(false);
  error = signal('');
  actionMessage = signal('');

  createCapacity = signal<number | null>(null);

  seatTableId = signal<number | null>(null);
  seatPeopleCount = signal<number>(1);

  leaveTableId = signal<number | null>(null);
  leavePeopleCount = signal<number>(1);

  assignPeopleCount = signal<number>(1);
  assignResult = signal<AssignTableResponse | null>(null);
  assigning = signal(false);

  sortedTables = computed(() =>
    [...this.tables()].sort((a, b) => a.id - b.id)
  );

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(showMessage = false): void {
    this.loading.set(true);
    this.error.set('');

    if (!showMessage) {
      this.actionMessage.set('');
    }

    this.tableService.getTables().subscribe({
      next: (data) => {
        this.tables.set(data);
        this.loading.set(false);

        const allTables = this.sortedTables();

        if (allTables.length > 0) {
          if (this.seatTableId() === null) {
            this.seatTableId.set(allTables[0].id);
          }

          if (this.leaveTableId() === null) {
            this.leaveTableId.set(allTables[0].id);
          }
        } else {
          this.seatTableId.set(null);
          this.leaveTableId.set(null);
        }
      },
      error: (err) => {
        console.error('Errore durante il caricamento dei tavoli:', err);
        this.error.set('Impossibile caricare i tavoli dal backend.');
        this.loading.set(false);
      }
    });
  }

  onCreateTable(): void {
    const capacity = this.createCapacity();

    if (capacity === null || capacity <= 0) {
      this.error.set('Inserisci una capienza valida maggiore di 0.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    this.tableService.createTable({ capacity }).subscribe({
      next: () => {
        this.actionMessage.set('Tavolo creato con successo.');
        this.createCapacity.set(null);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore creazione tavolo:', err);
        this.error.set('Errore durante la creazione del tavolo.');
      }
    });
  }

  onSeatPeople(): void {
    const tableId = this.seatTableId();
    const peopleCount = this.seatPeopleCount();

    if (tableId === null || peopleCount <= 0) {
      this.error.set('Seleziona un tavolo e inserisci un numero persone valido.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    this.tableService.seatPeople({ tableId, peopleCount }).subscribe({
      next: () => {
        this.actionMessage.set('Persone fatte sedere con successo.');
        this.seatPeopleCount.set(1);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore assegnazione posti:', err);
        this.error.set('Errore durante l’assegnazione dei posti.');
      }
    });
  }

  onLeavePeople(): void {
    const tableId = this.leaveTableId();
    const peopleCount = this.leavePeopleCount();

    if (tableId === null || peopleCount <= 0) {
      this.error.set('Seleziona un tavolo e inserisci un numero persone valido.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    this.tableService.leavePeople({ tableId, peopleCount }).subscribe({
      next: () => {
        this.actionMessage.set('Persone rimosse dal tavolo con successo.');
        this.leavePeopleCount.set(1);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore uscita persone:', err);
        this.error.set('Errore durante l’uscita delle persone dal tavolo.');
      }
    });
  }

  onSuggestTable(): void {
    const peopleCount = this.assignPeopleCount();

    if (peopleCount <= 0) {
      this.error.set('Inserisci un numero di persone valido per il suggerimento.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');
    this.assignResult.set(null);
    this.assigning.set(true);

    this.tableService.assignTable({ peopleCount }).subscribe({
      next: (result) => {
        this.assignResult.set(result);
        this.assigning.set(false);
      },
      error: (err) => {
        console.error('Errore suggerimento tavolo:', err);
        this.error.set('Impossibile ottenere un suggerimento di assegnazione.');
        this.assigning.set(false);
      }
    });
  }

  confirmSuggestedAssignment(): void {
    const result = this.assignResult();

    if (!result || result.suggestedTables.length === 0) {
      this.error.set('Nessuna proposta di assegnazione valida da confermare.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    if (!result.isSplitRequired) {
      const firstTable = result.suggestedTables[0];

      this.tableService.seatPeople({
        tableId: firstTable.id,
        peopleCount: result.requestedPeopleCount
      }).subscribe({
        next: () => {
          this.actionMessage.set('Assegnazione singola confermata con successo.');
          this.assignResult.set(null);
          this.assignPeopleCount.set(1);
          this.loadTables(true);
        },
        error: (err) => {
          console.error('Errore conferma assegnazione singola:', err);
          this.error.set('Errore durante la conferma dell’assegnazione singola.');
        }
      });

      return;
    }

    const tableIds = result.suggestedTables.map(table => table.id);

    this.tableService.seatSplit({
      peopleCount: result.requestedPeopleCount,
      tableIds
    }).subscribe({
      next: () => {
        this.actionMessage.set('Assegnazione split confermata con successo.');
        this.assignResult.set(null);
        this.assignPeopleCount.set(1);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore conferma assegnazione split:', err);
        this.error.set('Errore durante la conferma dell’assegnazione split.');
      }
    });
  }

  clearSuggestedAssignment(): void {
    this.assignResult.set(null);
  }

  quickSeat(tableId: number, peopleCount: number): void {
    this.error.set('');
    this.actionMessage.set('');

    this.tableService.seatPeople({ tableId, peopleCount }).subscribe({
      next: () => {
        this.actionMessage.set(`Aggiunte ${peopleCount} persone al tavolo ${tableId}.`);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore quick seat:', err);
        this.error.set(`Impossibile aggiungere persone al tavolo ${tableId}.`);
      }
    });
  }

  quickLeave(tableId: number, peopleCount: number): void {
    this.error.set('');
    this.actionMessage.set('');

    this.tableService.leavePeople({ tableId, peopleCount }).subscribe({
      next: () => {
        this.actionMessage.set(`Rimosse ${peopleCount} persone dal tavolo ${tableId}.`);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore quick leave:', err);
        this.error.set(`Impossibile rimuovere persone dal tavolo ${tableId}.`);
      }
    });
  }

  updateCreateCapacity(value: string): void {
    this.createCapacity.set(value ? Number(value) : null);
  }

  updateSeatTableId(value: string): void {
    this.seatTableId.set(value ? Number(value) : null);
  }

  updateSeatPeopleCount(value: string): void {
    this.seatPeopleCount.set(value ? Number(value) : 1);
  }

  updateLeaveTableId(value: string): void {
    this.leaveTableId.set(value ? Number(value) : null);
  }

  updateLeavePeopleCount(value: string): void {
    this.leavePeopleCount.set(value ? Number(value) : 1);
  }

  updateAssignPeopleCount(value: string): void {
    this.assignPeopleCount.set(value ? Number(value) : 1);
  }

  getFreeSeats(table: Table): number {
    return table.capacity - table.occupiedSeats;
  }

  getStatus(table: Table): 'Libero' | 'Parziale' | 'Pieno' {
    if (table.occupiedSeats === 0) return 'Libero';
    if (table.occupiedSeats >= table.capacity) return 'Pieno';
    return 'Parziale';
  }

  canSeat(table: Table, amount: number): boolean {
    return this.getFreeSeats(table) >= amount;
  }

  canLeave(table: Table, amount: number): boolean {
    return table.occupiedSeats >= amount;
  }

  getSuggestedTablesText(): string {
    const result = this.assignResult();

    if (!result || result.suggestedTables.length === 0) {
      return 'Nessun tavolo disponibile';
    }

    return result.suggestedTables
      .map(table => `Tavolo ${table.id}`)
      .join(', ');
  }
}
