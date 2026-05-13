using System;

namespace OrkaEval.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Link { get; set; }
    public string? Type { get; set; } // e.g., "Session", "Review", "System"

    public User? User { get; set; }
}
