using GestioneTavoliBar.Api.Models;

namespace GestioneTavoliBar.Api.Dtos
{
    public class AssignTableResponse
    {
        public bool IsSplitRequired { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<Table> SuggestedTables { get; set; } = new();
        public int RequestedPeopleCount { get; set; }
        public int TotalAvailableSeatsInSuggestion { get; set; }
    }
}
