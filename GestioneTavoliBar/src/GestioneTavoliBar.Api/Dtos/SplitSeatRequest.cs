namespace GestioneTavoliBar.Api.Dtos
{
    public class SplitSeatRequest
    {
        public int PeopleCount { get; set; }
        public List<int> TableIds { get; set; } = new();
    }
}
