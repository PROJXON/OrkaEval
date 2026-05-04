using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrkaEval.Api.Models;

public class FormSubmission
{
    public int Id { get; set; }

    [Required]
    public int? CoachId { get; set; }

    [Required]
    public int CandidateId { get; set; }

    [Required, MaxLength(50)]
    public string FormType { get; set; } = string.Empty; // open_discussion, checkin, coaching, evaluator, performance_review

    [Required]
    public string FormData { get; set; } = "{}"; // JSON data

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public int? CycleId { get; set; }
    
    [ForeignKey("CandidateId")]
    public Candidate? Candidate { get; set; }
    
    [ForeignKey("CoachId")]
    public Coach? Coach { get; set; }
}
