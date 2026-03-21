using Microsoft.EntityFrameworkCore;
using GestioneTavoliBar.Api.Models;

namespace GestioneTavoliBar.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) 
        { 
        }

        public DbSet<Table> Tables { get; set; }
    }
}
