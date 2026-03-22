using GestioneTavoliBar.Api.Data;
using GestioneTavoliBar.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GestioneTavoliBar.Api.Dtos;

namespace GestioneTavoliBar.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TablesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TablesController(AppDbContext context)
        {
            _context = context; 
        }

        //Metodo per l'aggiunta di un tavolo al DB
        [HttpPost]
        public async Task<ActionResult<Table>> AddTable(Table table)
        {
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTables), new { id = table.Id }, table);
        }

        //Metodo che ritorna la lista di tutti i tavoli presenti nel DB
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Table>>> GetTables()
        {
            var tables = await _context.Tables.ToListAsync();
            return Ok(tables);
        }

        //Metodo che ritorna un tavolo specifico fornendone l'id. Se non presente ritorna not found
        [HttpGet("{id}")]
        public async Task<ActionResult<Table>> GetTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
                return NotFound();

            return table;
        }

        //Metodo per l'eliminazione di un tavolo dal DB
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
                return NotFound();

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        //Metodo che gestisce l'assegnazione di un tavolo in funzione di N persone
        [HttpPost("assign")]
        public async Task<ActionResult<Table>> AssignTable([FromBody] AssignTableRequest request)
        {
            if (request.PeopleCount <= 0)
                return BadRequest("Il numero di persone deve essere maggiore di zero");


            //1. Cerca tavoli completamente liberi
            var emptyTable = await _context.Tables
                .Where(table => table.OccupiedSeats == 0 && table.Capacity >= request.PeopleCount)
                .OrderBy(table => table.Capacity)
                .FirstOrDefaultAsync();

            if (emptyTable != null)
                return Ok(new AssignTableResponse
                {
                    IsSplitRequired = false,
                    Message = "Tavolo singolo disponibile.",
                    RequestedPeopleCount = request.PeopleCount,
                    TotalAvailableSeatsInSuggestion = emptyTable.Capacity - emptyTable.OccupiedSeats,
                    SuggestedTables = new List<Table> { emptyTable }
                });

            //2. Cerca tavoli parzialmente occupati
            var partialTable = await _context.Tables
                .Where(table => table.OccupiedSeats > 0 && table.OccupiedSeats < table.Capacity && (table.Capacity - table.OccupiedSeats) >= request.PeopleCount)
                .OrderBy(table => (table.Capacity - table.OccupiedSeats))
                .FirstOrDefaultAsync();

            if (partialTable != null)
                return Ok(new AssignTableResponse
                {
                    IsSplitRequired = false,
                    Message = "Tavolo parzialmente occupato disponibile.",
                    RequestedPeopleCount = request.PeopleCount,
                    TotalAvailableSeatsInSuggestion = partialTable.Capacity - partialTable.OccupiedSeats,
                    SuggestedTables = new List<Table> { partialTable }
                });

            //3. Prova a dividere su píù tavoli
            var availableTables = await _context.Tables
                .Where(table => (table.Capacity - table.OccupiedSeats) > 0)
                .OrderBy(table => (table.Capacity - table.OccupiedSeats))
                .ToListAsync();

            var selectedTables = new List<Table>(); 
            int accumulatedSeats = 0;

            foreach (var table in availableTables)
            {
                selectedTables.Add(table);
                accumulatedSeats += (table.Capacity - table.OccupiedSeats);

                if (accumulatedSeats >= request.PeopleCount)
                    break;
            }

            if(accumulatedSeats >= request.PeopleCount)
            {
                return Ok(new AssignTableResponse
                {
                    IsSplitRequired = true,
                    Message = "Nessun tavolo singolo disponibile. Si propone la divisione del gruppo su più tavoli",
                    RequestedPeopleCount = request.PeopleCount,
                    TotalAvailableSeatsInSuggestion = accumulatedSeats,
                    SuggestedTables = selectedTables
                });
            }

            //4. Nessun tavolo trovato
            return NotFound(new AssignTableResponse
            {
                IsSplitRequired = false,
                Message = "Nessun posto libero sufficiente nel locale.",
                RequestedPeopleCount = request.PeopleCount,
                TotalAvailableSeatsInSuggestion = accumulatedSeats,
                SuggestedTables = new List<Table>()
            });
        }

        //Metodo che occupa il tavolo assegnato
        [HttpPost("seat")]
        public async Task<ActionResult<Table>> SeatPeople([FromBody] SeatPeopleRequest request)
        {
            if(request.PeopleCount <= 0)
                return BadRequest("Il numero di persone deve essere maggiore di zero");

            var table = await _context.Tables.FindAsync(request.TableId);

            if (table == null)
                return NotFound("Non è stato trovato il tavolo");

            int availableSeats = table.Capacity - table.OccupiedSeats;

            if (availableSeats < request.PeopleCount)
                return BadRequest("I posti disponibili sono insufficienti");

            table.OccupiedSeats += request.PeopleCount;

            await _context.SaveChangesAsync();

            return Ok(table);
        }

        //Metodo che si occupa di liberare dei posti sui tavoli
        [HttpPost("leave")]
        public async Task<ActionResult<Table>> LeaveTable([FromBody] LeaveTableRequest request)
        {
            if (request.PeopleCount <= 0)
                return BadRequest("Il numero di persone deve essere maggiore di zero");

            var table = await _context.Tables.FindAsync(request.TableId);

            if (table == null)
                return NotFound("Il tavolo non è stato trovato");

            if (table.OccupiedSeats < request.PeopleCount)
                return BadRequest("Non puoi far uscire più persone di quelle presenti al tavolo");

            table.OccupiedSeats -= request.PeopleCount;

            await _context.SaveChangesAsync();

            return Ok(table);
        }

        //Metodo che si occupa dello splitting di persone su più tavoli
        [HttpPost("seat-split")]
        public async Task<ActionResult<SplitSeatResponse>> SeatPeopleSplit([FromBody] SplitSeatRequest request)
        {
            if(request.PeopleCount <= 0)
                return BadRequest("Il numero di persone deve essere maggiore di zero");

            if (request.TableIds == null || request.TableIds.Count == 0)
                return BadRequest("Devi specificare almeno un tavolo");

            var tables = await _context.Tables
                .Where(table => request.TableIds.Contains(table.Id))
                .OrderBy(table => table.Id)
                .ToListAsync();

            if (tables.Count != request.TableIds.Count)
                return BadRequest("Uno o più tavoli selezionati non esistono");

            int totalAvailableSeats = tables.Sum(t => t.Capacity - t.OccupiedSeats);

            if (totalAvailableSeats < request.PeopleCount)
                return BadRequest("I tavoli selezionati non hanno posti sufficienti");

            int remainingPeople = request.PeopleCount;
            var allocations = new List<SplitSeatAllocationDto>();

            foreach (var table in tables)
            {
                int availableSeats = table.Capacity - table.OccupiedSeats;

                if (availableSeats <= 0)
                    continue;

                int peopleToAssign = Math.Min(availableSeats, remainingPeople);

                if (peopleToAssign > 0)
                {
                    table.OccupiedSeats += peopleToAssign;
                    remainingPeople -= peopleToAssign;

                    allocations.Add(new SplitSeatAllocationDto
                    {
                        TableId = table.Id,
                        AssignedPeopleCount = peopleToAssign
                    });
                }

                if (remainingPeople == 0)
                    break;
            }

            await _context.SaveChangesAsync();

            return Ok(new SplitSeatResponse
            {
                RequestedPeopleCount = request.PeopleCount,
                RemainingPeopleCount = remainingPeople,
                Allocations = allocations,
                Message = remainingPeople == 0 
                ? "Gruppo assegnato correttamente su più tavoli." 
                : "Assegnazione parziale completata."
            });
        }
    }
}
