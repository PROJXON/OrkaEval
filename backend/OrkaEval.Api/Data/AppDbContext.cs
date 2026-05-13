using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Models;

namespace OrkaEval.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<Cycle> Cycles => Set<Cycle>();
    public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    public DbSet<FormSubmission> FormSubmissions => Set<FormSubmission>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleId).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Evaluator)
                  .WithMany()
                  .HasForeignKey(e => e.EvaluatorId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.Status).HasConversion<string>();

            // Map complex JSON sections using EF Core 9 feature
            entity.OwnsOne(e => e.OpenDiscussion, b => b.ToJson());
            entity.OwnsOne(e => e.CheckIn, b => b.ToJson());
            entity.OwnsOne(e => e.Coaching, b => b.ToJson());
            entity.OwnsOne(e => e.Reflection, b => b.ToJson());
            entity.OwnsOne(e => e.Session, b => b.ToJson());
            
            // Map deeper JSON for competencies
            entity.OwnsOne(e => e.Competencies, cb => 
            {
                cb.ToJson();
                cb.OwnsOne(c => c.TechnicalSkills);
                cb.OwnsOne(c => c.Communication);
                cb.OwnsOne(c => c.Leadership);
                cb.OwnsOne(c => c.GrowthLearning);
                cb.OwnsOne(c => c.Culture);
            });
        });
        // ── PostgreSQL DateTime UTC Fix ──────────────────────────────────────────
        // Ensure all DateTime properties are converted to UTC before saving to Postgres
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
                        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
                        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    ));
                }
            }
        }
    }
}
