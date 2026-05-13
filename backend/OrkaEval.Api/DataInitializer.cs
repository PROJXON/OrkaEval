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
            
            // ── Manual Schema Updates (since EnsureCreated doesn't handle migrations) ──
            try
            {
                // 1. Ensure Notifications table exists (though EnsureCreated should handle new tables if missing)
                // 2. Ensure NotificationsEnabled column exists in Users table
                var isPostgres = db.Database.IsNpgsql();
                if (isPostgres)
                {
                    await db.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"NotificationsEnabled\" BOOLEAN DEFAULT TRUE;");
                    await db.Database.ExecuteSqlRawAsync(@"
                        CREATE TABLE IF NOT EXISTS ""Notifications"" (
                            ""Id"" SERIAL PRIMARY KEY,
                            ""UserId"" INTEGER NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                            ""Title"" TEXT NOT NULL,
                            ""Message"" TEXT NOT NULL,
                            ""IsRead"" BOOLEAN NOT NULL DEFAULT FALSE,
                            ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            ""Link"" TEXT,
                            ""Type"" TEXT
                        );
                    ");
                }
                else
                {
                    // SQLite
                    try { await db.Database.ExecuteSqlRawAsync("ALTER TABLE Users ADD COLUMN NotificationsEnabled INTEGER DEFAULT 1;"); } catch { }
                    try { 
                        await db.Database.ExecuteSqlRawAsync(@"
                            CREATE TABLE IF NOT EXISTS Notifications (
                                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                UserId INTEGER NOT NULL,
                                Title TEXT NOT NULL,
                                Message TEXT NOT NULL,
                                IsRead INTEGER NOT NULL DEFAULT 0,
                                CreatedAt TEXT NOT NULL,
                                Link TEXT,
                                Type TEXT,
                                FOREIGN KEY(UserId) REFERENCES Users(Id) ON DELETE CASCADE
                            );
                        "); 
                    } catch { }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> Schema Update Warning: {ex.Message}");
            }
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
