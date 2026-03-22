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

        [HttpPost]
        public async Task<ActionResult<Table>> AddTable(Table table)
        {
            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTables), new { id = table.Id }, table);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Table>>> GetTables()
        {
            var tables = await _context.Tables.ToListAsync();
            return Ok(tables);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Table>> GetTable(int id)
        {
            var table = await _context.Tables.FindAsync(id);

            if (table == null)
                return NotFound();

            return table;
        }

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
                return Ok(emptyTable);

            //2. Cerca tavoli parzialmente occupati
            var partialTable = _context.Tables
                .Where(table => table.OccupiedSeats > 0 && table.OccupiedSeats < table.Capacity && (table.Capacity - table.OccupiedSeats) >= request.PeopleCount)
                .OrderBy(table => (table.Capacity - table.OccupiedSeats))
                .FirstOrDefaultAsync();

            if (partialTable != null)
                return Ok(partialTable);

            //3. Nessun tavolo trovato
            return NotFound("Non è stato possibile trovare un tavolo singolo per questo numero di persone");
        }
    }
}
