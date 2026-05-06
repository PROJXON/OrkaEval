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

        // 1. Fresh Start Check (WIPE)
        // Set WIPE_DATABASE=true in Render environment variables if you want to clear the DB again.
        var shouldWipe = Environment.GetEnvironmentVariable("WIPE_DATABASE") == "true";
        
        if (shouldWipe)
        {
            Console.WriteLine(">>> WIPE_DATABASE=true detected. Recreating database...");
            await db.Database.EnsureDeletedAsync();
            await db.Database.MigrateAsync();
            Console.WriteLine(">>> Database recreated. Starting fresh seed...");
        }
        else 
        {
            // Normal migration flow
            Console.WriteLine(">>> Running Database Migrations...");
            await db.Database.MigrateAsync();
        }

        // 2. Maintenance Logic (Cycle Generation)
        Console.WriteLine(">>> Generating Missing Cycles...");
        await GenerateMissingCycles(db);
        
        // 3. Maintenance Logic (Role Fix)
        try 
        {
            await db.Database.ExecuteSqlRawAsync("UPDATE \"Users\" SET \"Role\" = 'Candidate' WHERE \"Role\" = 'TeamMember'");
        }
        catch { /* Ignore if fails on fresh DB */ }

        // 5. Seed Core Admin / Development Data
        await SeedCoreData(db, environment.IsDevelopment());
    }

    private static async Task GenerateMissingCycles(AppDbContext db)
    {
        var now = DateTime.UtcNow;
        var candidates = await db.Candidates.ToListAsync();
        foreach (var cand in candidates)
        {
            var latestCycle = await db.Cycles
                .Where(c => c.CandidateId == cand.Id)
                .OrderByDescending(c => c.StartDate)
                .FirstOrDefaultAsync();

            if (latestCycle != null && now > latestCycle.EndDate)
            {
                var currentStart = latestCycle.EndDate;
                var currentNum = latestCycle.Number;
                while (now >= currentStart)
                {
                    currentNum++;
                    var nextCycle = new Cycle
                    {
                        CandidateId = cand.Id,
                        Number = currentNum,
                        StartDate = currentStart,
                        EndDate = currentStart.AddDays(56)
                    };
                    db.Cycles.Add(nextCycle);
                    currentStart = nextCycle.EndDate;
                }
                await db.SaveChangesAsync();
            }
        }

        // Align evaluations to correct cycles
        var evals = await db.Evaluations.ToListAsync();
        var allCycles = await db.Cycles.ToListAsync();
        foreach (var e in evals)
        {
            var cand = candidates.FirstOrDefault(c => c.UserId == e.UserId);
            if (cand == null) continue;
            var correctCycle = allCycles.FirstOrDefault(c => c.CandidateId == cand.Id && c.StartDate <= e.UpdatedAt && c.EndDate >= e.UpdatedAt);
            if (correctCycle != null && e.CycleId != correctCycle.Id)
            {
                e.CycleId = correctCycle.Id;
            }
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedCoreData(AppDbContext db, bool isDevelopment)
    {
        var email = "jagadeesh.madhineni.projxon@gmail.com";
        var defaultName = "Jagadeesh Madhineni";
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            user = new User
            {
                Email = email,
                DisplayName = defaultName,
                Role = UserRole.Both,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                StartDate = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        if (string.IsNullOrWhiteSpace(user.DisplayName)) user.DisplayName = defaultName;
        if (user.Role != UserRole.Both) user.Role = UserRole.Both;
        await db.SaveChangesAsync();

        // Ensure Coach record
        var coach = await db.Coaches.FirstOrDefaultAsync(c => c.UserId == user.Id);
        if (coach == null)
        {
            db.Coaches.Add(new Coach
            {
                UserId = user.Id,
                FullName = user.DisplayName,
                Email = user.Email,
                StartDate = user.StartDate
            });
        }

        // Ensure Candidate record
        var candidate = await db.Candidates.FirstOrDefaultAsync(c => c.UserId == user.Id);
        if (candidate == null)
        {
            candidate = new Candidate
            {
                UserId = user.Id,
                FullName = user.DisplayName,
                Email = user.Email,
                StartDate = user.StartDate,
                CycleStart = user.StartDate,
                CycleEnd = user.StartDate.AddDays(56)
            };
            db.Candidates.Add(candidate);
            await db.SaveChangesAsync();
        }

        // Ensure Initial Cycle
        if (candidate != null && !await db.Cycles.AnyAsync(cy => cy.CandidateId == candidate.Id))
        {
            db.Cycles.Add(new Cycle
            {
                CandidateId = candidate.Id,
                Number = 1,
                StartDate = candidate.CycleStart,
                EndDate = candidate.CycleEnd
            });
        }

        await db.SaveChangesAsync();
    }
}
