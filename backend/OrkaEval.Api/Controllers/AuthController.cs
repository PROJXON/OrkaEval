using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using OrkaEval.Api.Services;
using OrkaEval.Api.Models.DTOs;
using System.Security.Claims;

namespace OrkaEval.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly IAuditService _auditService;
    private readonly IWebHostEnvironment _env;
    private readonly IImageService _imageService;

    public AuthController(AppDbContext db, TokenService tokenService, IConfiguration config, IAuditService auditService, IWebHostEnvironment env, IImageService imageService)
    {
        _db = db;
        _tokenService = tokenService;
        _config = config;
        _auditService = auditService;
        _env = env;
        _imageService = imageService;
    }

    [HttpGet("coaches")]
    public async Task<IActionResult> GetAvailableCoaches()
    {
        var coaches = await _db.Coaches
            .Select(c => new { c.Id, c.FullName, c.UserId })
            .ToListAsync();
        return Ok(coaches);
    }

    /// <summary>Initiates the Google OAuth flow.</summary>
    [HttpGet("google")]
    public async Task<IActionResult> SignInWithGoogle([FromQuery] string? returnUrl = null)
    {
        // ── DEV MOCK BYPASS ───────────────────────────────────────────────────
        if (_config["Authentication:Google:ClientId"] == "mock-client-id")
        {
            var devUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == "dev@orkaeval.local");
            if (devUser == null)
            {
                devUser = new User
                {
                    Email = "dev@orkaeval.local",
                    DisplayName = "Dev Orka",
                    Role = UserRole.Both,
                    AvatarUrl = "https://ui-avatars.com/api/?name=Dev+Orka&background=00BFA5&color=fff"
                };
                _db.Users.Add(devUser);
                await _db.SaveChangesAsync();
            }
            var devToken = _tokenService.GenerateToken(devUser);
            await _auditService.LogAsync(devUser.Id, "UserLogin", "Dev mock login");
            return RedirectToFrontend(devToken, true);
        }
        // ─────────────────────────────────────────────────────────────────────

        var desktop = string.Equals(returnUrl, "electron", StringComparison.OrdinalIgnoreCase) ? "1" : null;
        var callbackUrl = Url.Action(nameof(GoogleCallback), "Auth", new { desktop }, Request.Scheme)!;
        var properties = new AuthenticationProperties
        {
            RedirectUri = callbackUrl,
            Items = { { "returnUrl", returnUrl ?? "/" } }
        };
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>Handles the Google OAuth callback, logs the user in if they exist, or redirects to register.</summary>
    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromQuery] string? desktop = null)
    {
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!result.Succeeded)
        {
            return Redirect($"{GetFrontendUrl()}/?error=auth_failed");
        }
        var forceElectron = string.Equals(desktop, "1", StringComparison.OrdinalIgnoreCase);

        var principal = result.Principal!;
        var googleId = principal.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var email = principal.FindFirstValue(ClaimTypes.Email)!;
        var displayName = principal.FindFirstValue(ClaimTypes.Name) ?? email;
        var avatarUrl = principal.Claims
            .FirstOrDefault(c => c.Type.Contains("picture") || c.Type == "urn:google:picture")?.Value;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            // NEW USER: Redirect to the frontend registration page with their Google info pre-filled
            var registerUrl = $"{GetFrontendUrl()}/register?email={Uri.EscapeDataString(email)}&name={Uri.EscapeDataString(displayName)}&googleId={googleId}&avatarUrl={Uri.EscapeDataString(avatarUrl ?? "")}";
            return Redirect(registerUrl);
        }

        // RETURNING USER
        user.GoogleId ??= googleId;
        user.AvatarUrl = avatarUrl;
        user.DisplayName = displayName; // Optional: update display name from Google
        user.LastLoginAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "UserLogin", "Google OAuth login");

        var token = _tokenService.GenerateToken(user);
        return RedirectToFrontend(token, forceElectron);
    }



    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        req.Email = req.Email.Trim().ToLowerInvariant();
        var existing = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email);
        if (existing != null) return BadRequest(new { message = "Email already in use." });

        if (string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { message = "Password is required." });
        }

        var role = UserRole.Both; // Default to both as per requirements

        var user = new User
        {
            Email = req.Email,
            DisplayName = req.DisplayName,
            GoogleId = req.GoogleId,
            AvatarUrl = req.AvatarUrl,
            Role = role,
            StartDate = req.StartDate,
            PasswordHash = !string.IsNullOrWhiteSpace(req.Password) ? BCrypt.Net.BCrypt.HashPassword(req.Password) : null
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Handle role-specific tables
        if (role == UserRole.Candidate || role == UserRole.Both)
        {
            var candidate = new Candidate
            {
                UserId = user.Id,
                FullName = user.DisplayName,
                Email = user.Email,
                PasswordHash = user.PasswordHash,
                StartDate = user.StartDate,
                CycleStart = user.StartDate,
                CycleEnd = user.StartDate.AddDays(56), // 8 weeks
                CoachId = req.CoachId
            };
            _db.Candidates.Add(candidate);
            await _db.SaveChangesAsync();

            // Create initial cycle
            var cycle = new Cycle
            {
                CandidateId = candidate.Id,
                Number = 1,
                StartDate = candidate.CycleStart,
                EndDate = candidate.CycleEnd
            };
            _db.Cycles.Add(cycle);
        }

        if (role == UserRole.Coach || role == UserRole.Both)
        {
            var coach = new Coach
            {
                UserId = user.Id,
                FullName = user.DisplayName,
                Email = user.Email,
                PasswordHash = user.PasswordHash,
                StartDate = user.StartDate
            };
            _db.Coaches.Add(coach);
        }

        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "UserLogin", "Registered");

        var token = _tokenService.GenerateToken(user);

        // Fetch additional profile info for the dashboard
        string? participantName = null;
        string? coachName = null;

        if (user.Role == UserRole.Candidate || user.Role == UserRole.Both)
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == user.Id);
            participantName = candidate?.FullName;
        }
        else if (user.Role == UserRole.Coach)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == user.Id);
            coachName = coach?.FullName;
        }

        return Ok(new { 
            token, 
            user = new {
                id = user.Id,
                email = user.Email,
                displayName = user.DisplayName,
                avatarUrl = user.AvatarUrl,
                role = user.Role.ToString(),
                participantName,
                coachName,
                startDate = user.StartDate
            }
        });
    }



    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        req.Email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email);
        
        if (user == null)
        {
            Console.WriteLine($"[AUTH] Login failed: User not found for email '{req.Email}'");
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            Console.WriteLine($"[AUTH] Login failed: User '{user.Email}' has no password hash. They likely signed up with Google.");
            return Unauthorized(new { message = "This account was created via Google. Please use 'Continue with Google'." });
        }

        bool isValid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
        if (!isValid)
        {
            Console.WriteLine($"[AUTH] Login failed: Password mismatch for user '{user.Email}'");
            return Unauthorized(new { message = "Invalid email or password." });
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "UserLogin", "Password login");

        var token = _tokenService.GenerateToken(user);

        // Fetch additional profile info for the dashboard
        string? participantName = null;
        string? coachName = null;

        if (user.Role == UserRole.Candidate || user.Role == UserRole.Both)
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == user.Id);
            participantName = candidate?.FullName;
            
            if (candidate?.CoachId != null)
            {
                var coach = await _db.Coaches.FindAsync(candidate.CoachId);
                coachName = coach?.FullName;
            }
        }
        else if (user.Role == UserRole.Coach)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == user.Id);
            coachName = coach?.FullName;
        }

        return Ok(new { 
            token, 
            user = new {
                id = user.Id,
                email = user.Email,
                displayName = user.DisplayName,
                avatarUrl = user.AvatarUrl,
                role = user.Role.ToString(),
                participantName,
                coachName,
                startDate = user.StartDate
            }
        });
    }



    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        req.Email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == req.Email);
        
        // Always return OK even if user doesn't exist for security (avoid enumeration)
        if (user == null) return Ok(new { message = "If the account exists, a reset link will be sent." });

        var token = Guid.NewGuid().ToString("N");
        user.ResetToken = token;
        user.ResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        
        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "PasswordReset", "Requested password reset");

        // Only return the token in dev so it can be tested without SMTP
        if (_env.IsDevelopment())
        {
            return Ok(new { 
                message = "If the account exists, a reset link will be sent.",
                devResetToken = token
            });
        }

        return Ok(new { message = "If the account exists, a reset link will be sent." });
    }



    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.ResetToken == req.Token && u.ResetTokenExpiry > DateTime.UtcNow);
        
        if (user == null)
        {
            Console.WriteLine($"[AUTH] Reset failed: Token '{req.Token}' not found or expired.");
            return BadRequest(new { message = "Invalid or expired reset token." });
        }

        Console.WriteLine($"[AUTH] Resetting password for user '{user.Email}'");
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;

        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "PasswordReset", "Password changed successfully");

        return Ok(new { message = "Password has been reset successfully." });
    }

    /// <summary>Returns the currently authenticated user's profile.</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        object? candidateData = null;
        object? coachData = null;
        object? currentCycle = null;

        if (user.Role == UserRole.Candidate || user.Role == UserRole.Both)
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (candidate != null)
            {
                // Find current cycle
                var now = DateTime.UtcNow;
                var cycle = await _db.Cycles
                    .Where(cy => cy.CandidateId == candidate.Id && cy.StartDate <= now && cy.EndDate >= now)
                    .OrderByDescending(cy => cy.CreatedAt)
                    .FirstOrDefaultAsync();
                
                // If no current cycle, check if we need to create one (lazy creation)
                if (cycle == null)
                {
                    var latestCycle = await _db.Cycles
                        .Where(cy => cy.CandidateId == candidate.Id)
                        .OrderByDescending(cy => cy.StartDate)
                        .FirstOrDefaultAsync();

                    if (latestCycle != null && now > latestCycle.EndDate)
                    {
                        // Create next cycle(s) until we reach 'now'
                        var currentStart = latestCycle.EndDate;
                        var currentNum = latestCycle.Number;

                        while (now >= currentStart)
                        {
                            currentNum++;
                            var nextCycle = new Cycle
                            {
                                CandidateId = candidate.Id,
                                Number = currentNum,
                                StartDate = currentStart,
                                EndDate = currentStart.AddDays(56)
                            };
                            _db.Cycles.Add(nextCycle);
                            latestCycle = nextCycle;
                            currentStart = nextCycle.EndDate;
                            
                            if (now >= nextCycle.StartDate && now < nextCycle.EndDate)
                            {
                                cycle = nextCycle;
                            }
                        }
                        await _db.SaveChangesAsync();
                    }
                }

                // Final fallback: get latest
                cycle ??= await _db.Cycles
                    .Where(cy => cy.CandidateId == candidate.Id)
                    .OrderByDescending(cy => cy.StartDate)
                    .FirstOrDefaultAsync();

                candidateData = new { candidate.Id, candidate.CoachId, candidate.CycleStart, candidate.CycleEnd };
                currentCycle = cycle;
            }
        }

        if (user.Role == UserRole.Coach || user.Role == UserRole.Both)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (coach != null)
            {
                coachData = new { coach.Id };
            }
        }

        // Fetch names for dashboard display
        string? participantName = null;
        string? coachName = null;

        if (user.Role == UserRole.Candidate || user.Role == UserRole.Both)
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == user.Id);
            participantName = candidate?.FullName;
            if (candidate?.CoachId != null)
            {
                var coach = await _db.Coaches.FindAsync(candidate.CoachId);
                coachName = coach?.FullName;
            }
        }
        else if (user.Role == UserRole.Coach)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == user.Id);
            coachName = coach?.FullName;
        }

        return Ok(new 
        { 
            id = user.Id, 
            email = user.Email, 
            displayName = user.DisplayName, 
            avatarUrl = user.AvatarUrl,
            role = user.Role.ToString(),
            startDate = user.StartDate,
            participantName,
            coachName,
            candidateData = candidateData,
            coachData = coachData,
            currentCycle = currentCycle
        });
    }



    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.DisplayName))
            user.DisplayName = req.DisplayName;

        if (!string.IsNullOrWhiteSpace(req.Department))
            user.Department = req.Department;

        if (!string.IsNullOrWhiteSpace(req.AvatarUrl))
            user.AvatarUrl = req.AvatarUrl;

        if (req.NotificationsEnabled.HasValue)
            user.NotificationsEnabled = req.NotificationsEnabled.Value;

        await _db.SaveChangesAsync();
        await _auditService.LogAsync(user.Id, "ProfileUpdate", "User updated profile details");

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.AvatarUrl,
            user.Department,
            user.NotificationsEnabled,
            Role = user.Role.ToString()
        });
    }

    [Authorize]
    [HttpPost("profile/avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        try
        {
            // Upload to Cloudinary if configured, otherwise fallback to local (local will be ephemeral)
            var cloudUrl = await _imageService.UploadImageAsync(file);
            
            if (!string.IsNullOrEmpty(cloudUrl))
            {
                user.AvatarUrl = cloudUrl;
            }
            else
            {
                // Fallback to local storage (for dev or if Cloudinary fails/not configured)
                var extension = Path.GetExtension(file.FileName).ToLower();
                var fileName = $"{userId}_{DateTime.UtcNow.Ticks}{extension}";
                var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "avatars", fileName);
                
                if (!Directory.Exists(Path.GetDirectoryName(path)))
                    Directory.CreateDirectory(Path.GetDirectoryName(path)!);

                using (var stream = new FileStream(path, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                user.AvatarUrl = $"/avatars/{fileName}";
            }

            await _db.SaveChangesAsync();
            await _auditService.LogAsync(user.Id, "AvatarUpload", $"User uploaded new profile picture: {user.AvatarUrl}");

            return Ok(new { avatarUrl = user.AvatarUrl });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Upload failed: {ex.Message}" });
        }
    }




    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        // Verify current password
        if (user.PasswordHash == null || !BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Incorrect current password." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();
        
        await _auditService.LogAsync(user.Id, "PasswordUpdate", "User updated their password");

        return Ok(new { message = "Password updated successfully." });
    }

    [Authorize]
    [HttpPut("profile/coach")]
    public async Task<IActionResult> UpdateCoach([FromBody] UpdateCoachRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == userId);
        if (candidate == null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();
            
            candidate = new Candidate
            {
                UserId = user.Id,
                FullName = user.DisplayName,
                Email = user.Email,
                StartDate = user.StartDate,
                CycleStart = user.StartDate,
                CycleEnd = user.StartDate.AddDays(56)
            };
            _db.Candidates.Add(candidate);
            await _db.SaveChangesAsync();

            // Also create initial cycle
            var cycle = new Cycle
            {
                CandidateId = candidate.Id,
                Number = 1,
                StartDate = candidate.CycleStart,
                EndDate = candidate.CycleEnd
            };
            _db.Cycles.Add(cycle);
        }

        candidate.CoachId = req.CoachId;
        await _db.SaveChangesAsync();

        // Fetch coach name for return
        string? coachName = null;
        if (req.CoachId != null)
        {
            var coach = await _db.Coaches.FindAsync(req.CoachId);
            coachName = coach?.FullName;
        }

        var coachRecord = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coachRecord == null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                coachRecord = new Coach
                {
                    UserId = user.Id,
                    FullName = user.DisplayName,
                    Email = user.Email,
                    StartDate = user.StartDate
                };
                _db.Coaches.Add(coachRecord);
                await _db.SaveChangesAsync();
            }
        }

        await _auditService.LogAsync(userId, "ProfileUpdate", $"User updated their coach to {coachName ?? "None"}");

        return Ok(new { coachId = candidate.CoachId, coachName });
    }

    public class UpdateCoachRequest
    {
        public int? CoachId { get; set; }
    }

    /// <summary>Returns a directory of all registered users for autocomplete.</summary>
    [Authorize]
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _db.Users
            .Select(u => new
            {
                name = u.DisplayName,
                email = u.Email,
                dept = u.Department
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>Signs the user out (client should discard the JWT).</summary>
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Stateless JWT — client drops the token
        return Ok(new { message = "Logged out successfully." });
    }

    private IActionResult RedirectToFrontend(string token, bool forceElectron = false)
    {
        if (forceElectron)
        {
            // Redirect using custom protocol for Electron deep linking
            return Redirect($"orkaeval://auth-callback?token={token}");
        }
        var frontendUrl = GetFrontendUrl();
        return Redirect($"{frontendUrl}/dashboard?token={token}");
    }

    private string GetFrontendUrl() =>
        _config["Frontend:Url"] ?? "http://localhost:5173";
}
