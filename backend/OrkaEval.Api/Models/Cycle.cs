using System.ComponentModel.DataAnnotations;

namespace OrkaEval.Api.Models;

public class Cycle
{
    public int Id { get; set; }
    
    [Required]
    public int CandidateId { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Number { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
