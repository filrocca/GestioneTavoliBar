namespace GestioneTavoliBar.Api.Dtos
{
    public class SplitSeatResponse
    {
        public int RequestedPeopleCount { get; set; }
        public int RemainingPeopleCount { get; set; }
        public List<SplitSeatAllocationDto> Allocations { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class SplitSeatAllocationDto
    {
        public int TableId { get; set; }
        public int AssignedPeopleCount { get; set; }
    }
}
