import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
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
  showAssignModal = signal(false);

  selectedOverrideTableId = signal<number | null>(null);

  showDeleteModal = signal(false);
  tableToDelete = signal<Table | null>(null);

  sortedTables = computed(() =>
    [...this.tables()].sort((a, b) => a.id - b.id)
  );

  totalTables = computed(() => this.tables().length);

  totalCapacity = computed(() =>
    this.tables().reduce((sum, table) => sum + table.capacity, 0)
  );

  totalOccupiedSeats = computed(() =>
    this.tables().reduce((sum, table) => sum + table.occupiedSeats, 0)
  );

  totalFreeSeats = computed(() =>
    this.tables().reduce((sum, table) => sum + this.getFreeSeats(table), 0)
  );

  compatibleOverrideTables = computed(() => {
    const result = this.assignResult();

    if (!result || result.isSplitRequired) {
      return [];
    }

    return this.sortedTables().filter(
      table => this.getFreeSeats(table) >= result.requestedPeopleCount
    );
  });

  ngOnInit(): void {
    this.loadTables();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showAssignModal()) {
      this.closeAssignModal();
    }

    if (this.showDeleteModal())
      this.closeDeleteModal();
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

  confirmDeleteTable(): void {
    const table = this.tableToDelete();

    if (!table) {
      this.error.set('Nessun tavolo selezionato per l’eliminazione.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    this.tableService.deleteTable(table.id).subscribe({
      next: () => {
        this.actionMessage.set(`Tavolo ${table.id} eliminato con successo.`);
        this.closeDeleteModal();
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore eliminazione tavolo:', err);
        this.error.set(`Impossibile eliminare il tavolo ${table.id}.`);
      }
    });
  }

  closeDeleteModal(): void {
    this.tableToDelete.set(null);
    this.showDeleteModal.set(false);
  }

  openDeleteModal(table: Table): void {
    this.tableToDelete.set(table);
    this.showDeleteModal.set(true);
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
    this.showAssignModal.set(false);
    this.selectedOverrideTableId.set(null);

    this.tableService.assignTable({ peopleCount }).subscribe({
      next: (result) => {
        this.assignResult.set(result);
        this.assigning.set(false);
        this.showAssignModal.set(true);
        this.selectedOverrideTableId.set(null);
      },
      error: (err) => {
        console.error('Errore suggerimento tavolo:', err);
        this.error.set('Impossibile ottenere un suggerimento di assegnazione.');
        this.assigning.set(false);
      }
    });
  }

  confirmSuggestedTableOnly(): void {
    const result = this.assignResult();

    if (!result || result.suggestedTables.length === 0) {
      this.error.set('Nessuna proposta di assegnazione valida da confermare.');
      return;
    }

    const suggestedTableId = result.suggestedTables[0]?.id;

    if (!suggestedTableId) {
      this.error.set('Nessun tavolo suggerito disponibile.');
      return;
    }

    this.error.set('');
    this.actionMessage.set('');

    this.tableService.seatPeople({
      tableId: suggestedTableId,
      peopleCount: result.requestedPeopleCount
    }).subscribe({
      next: () => {
        this.actionMessage.set(`Assegnazione confermata sul tavolo suggerito ${suggestedTableId}.`);
        this.assignResult.set(null);
        this.assignPeopleCount.set(1);
        this.selectedOverrideTableId.set(null);
        this.showAssignModal.set(false);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore conferma tavolo suggerito:', err);
        this.error.set('Errore durante la conferma del tavolo suggerito.');
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
      const chosenTableId = this.selectedOverrideTableId();

      if (chosenTableId === null) {
        this.error.set('Seleziona un tavolo compatibile dal menu prima di confermare la variazione.');
        return;
      }

      this.tableService.seatPeople({
        tableId: chosenTableId,
        peopleCount: result.requestedPeopleCount
      }).subscribe({
        next: () => {
          this.actionMessage.set(`Assegnazione confermata sul tavolo ${chosenTableId}.`);
          this.assignResult.set(null);
          this.assignPeopleCount.set(1);
          this.selectedOverrideTableId.set(null);
          this.showAssignModal.set(false);
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
        this.selectedOverrideTableId.set(null);
        this.showAssignModal.set(false);
        this.loadTables(true);
      },
      error: (err) => {
        console.error('Errore conferma assegnazione split:', err);
        this.error.set('Errore durante la conferma dell’assegnazione split.');
      }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
  }

  clearSuggestedAssignment(): void {
    this.assignResult.set(null);
    this.selectedOverrideTableId.set(null);
    this.showAssignModal.set(false);
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

  updateSelectedOverrideTableId(value: string): void {
    this.selectedOverrideTableId.set(value ? Number(value) : null);
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

  getAssignTypeLabel(): string {
    const result = this.assignResult();

    if (!result) {
      return '';
    }

    return result.isSplitRequired ? 'Split' : 'Singolo';
  }
}
