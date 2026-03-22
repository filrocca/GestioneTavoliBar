import { Table } from './table.model';

export interface AssignTableResponse {
  isSplitRequired: boolean;
  message: string;
  suggestedTables: Table[];
  requestedPeopleCount: number;
  totalAvailableSeatsInSuggestion: number;
}
