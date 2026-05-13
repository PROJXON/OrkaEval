using System.ComponentModel.DataAnnotations;

namespace OrkaEval.Api.Models;

public enum UserRole
{
    Candidate,
    Coach,
    Both,
    Admin,
    TeamMember // Added for legacy database compatibility
}

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? PasswordHash { get; set; }

    public UserRole Role { get; set; } = UserRole.Candidate;
    public bool NotificationsEnabled { get; set; } = true;

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastLoginAt { get; set; }

    [MaxLength(128)]
    public string? GoogleId { get; set; }

    public string? AvatarUrl { get; set; }

    [MaxLength(256)]
    public string? Department { get; set; }

    [MaxLength(128)]
    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpiry { get; set; }
}
