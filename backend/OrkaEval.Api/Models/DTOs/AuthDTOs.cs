namespace OrkaEval.Api.Models.DTOs;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Password { get; set; }
    public DateTime StartDate { get; set; }
    public string ProfileType { get; set; } = "candidate"; // candidate, coach, both
    public string? Role { get; set; } // Alias for ProfileType
    public string? GoogleId { get; set; }
    public string? AvatarUrl { get; set; }
    public int? CoachId { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string? DisplayName { get; set; }
    public string? Department { get; set; }
    public string? AvatarUrl { get; set; }
    public bool? NotificationsEnabled { get; set; }
}

public class UpdatePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
