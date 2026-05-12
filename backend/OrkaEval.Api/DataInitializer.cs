using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;

namespace OrkaEval.Api;

public static class DataInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider, IWebHostEnvironment environment)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 1. Production Mode (Locked - Preserves User Data)
        var shouldWipe = false; 
        
        if (shouldWipe)
        {
            Console.WriteLine(">>> FINAL WIPE TRIGGERED. Setting password to Jay@123...");
            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();
        }
        else 
        {
            await db.Database.EnsureCreatedAsync();
        }

        // 2. Seed Admin Data
        await SeedCoreData(db);
    }

    private static async Task SeedCoreData(AppDbContext db)
    {
        var email = "jagadeesh.madhineni.projxon@gmail.com";
        var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existingUser != null) return;

        var user = new User
        {
            Email = email,
            DisplayName = "Jagadeesh Madhineni",
            Role = UserRole.Both,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Projxon@eval#2026"),
            StartDate = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var coach = new Coach { UserId = user.Id, FullName = user.DisplayName, Email = user.Email, StartDate = user.StartDate };
        db.Coaches.Add(coach);

        var candidate = new Candidate { UserId = user.Id, FullName = user.DisplayName, Email = user.Email, StartDate = user.StartDate, CycleStart = user.StartDate, CycleEnd = user.StartDate.AddDays(56) };
        db.Candidates.Add(candidate);

        db.Cycles.Add(new Cycle { CandidateId = candidate.Id, Number = 1, StartDate = candidate.CycleStart, EndDate = candidate.CycleEnd });
        await db.SaveChangesAsync();
    }
}
