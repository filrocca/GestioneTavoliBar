# Gestione Tavoli Bar

Prova tecnica full-stack per la gestione dei tavoli di un bar/ristorante.

## Tecnologie utilizzate

### Backend
- ASP.NET Core Web API (.NET 10)
- Entity Framework Core
- SQL Server Express

### Frontend
- Angular 21+
- Standalone Components
- Signals

---

## Funzionalità implementate

- Visualizzazione lista tavoli
- Creazione tavolo
- Eliminazione tavolo con conferma tramite modal
- Gestione occupazione posti:
  - far sedere persone
  - far alzare persone
  - pulsanti rapidi +1 / +2 / -1 / -2
- Stato tavolo:
  - Libero
  - Parziale
  - Pieno
- Dashboard riepilogativa:
  - tavoli totali
  - posti totali
  - posti occupati
  - posti liberi
- Suggerimento automatico tavolo
- Gestione assegnazione singola o split
- Possibilità di modificare manualmente il tavolo suggerito nel caso di assegnazione singola, previo controllo dei posti liberi

---

## Struttura progetto

```text
backend/
frontend/
README.md
init-database.sql
