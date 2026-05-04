using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrkaEval.Api.Models;

public class Coach
{
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [ForeignKey("UserId")]
    public User? User { get; set; }

    [Required, MaxLength(256)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    public string? PasswordHash { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
