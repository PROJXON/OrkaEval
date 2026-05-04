using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using OrkaEval.Api.Models.DTOs;
using OrkaEval.Api.Profiles;
using OrkaEval.Api.Services;

namespace OrkaEval.Tests.Services;

public class EvaluationServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile(new EvaluationProfile()));
        return config.CreateMapper();
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static EvaluationService CreateService(AppDbContext db)
    {
        var email = new Mock<IEmailService>();
        var audit = new Mock<IAuditService>();
        return new EvaluationService(db, CreateMapper(), email.Object, audit.Object);
    }

    [Fact]
    public async Task GetMyEvaluationAsync_ReturnsNull_WhenNoEvaluationExists()
    {
        using var db = CreateDb();
        var service = CreateService(db);

        var result = await service.GetMyEvaluationAsync(userId: 1, cycleId: 1);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetMyEvaluationAsync_ReturnsEvaluation_WhenItExists()
    {
        using var db = CreateDb();
        db.Evaluations.Add(new Evaluation
        {
            UserId = 1,
            CycleId = 1,
            Competencies = new CompetenciesSection
            {
                TechnicalSkills = new CompetencyRating { SelfRating = 4 }
            }
        });
        await db.SaveChangesAsync();
        var service = CreateService(db);

        var result = await service.GetMyEvaluationAsync(1, 1);

        result.Should().NotBeNull();
        result!.Competencies.TechnicalSkills.SelfRating.Should().Be(4);
    }

    [Fact]
    public async Task SaveSelfEvaluationAsync_CreatesNewEvaluation_WhenNoneExists()
    {
        using var db = CreateDb();
        var service = CreateService(db);

        var dto = new EvaluationCreateDto
        {
            Reflection = new ReflectionSection { Goal1 = "Ship feature" }
        };
        var result = await service.SaveSelfEvaluationAsync(1, 2, dto);

        result.Should().NotBeNull();
        result.CycleId.Should().Be(2);
        result.Status.Should().Be(EvaluationStatus.SelfCompleted);
        db.Evaluations.Count().Should().Be(1);
    }

    [Fact]
    public async Task SaveSelfEvaluationAsync_UpdatesExistingEvaluation()
    {
        using var db = CreateDb();
        db.Evaluations.Add(new Evaluation
        {
            UserId = 2,
            CycleId = 1,
            Reflection = new ReflectionSection { Goal1 = "Old goal" }
        });
        await db.SaveChangesAsync();
        var service = CreateService(db);

        var dto = new EvaluationCreateDto
        {
            Reflection = new ReflectionSection { Goal1 = "New goal" }
        };
        await service.SaveSelfEvaluationAsync(2, 1, dto);

        db.Evaluations.Count().Should().Be(1);
        var updated = await db.Evaluations.SingleAsync();
        updated.Reflection.Goal1.Should().Be("New goal");
    }

    [Fact]
    public async Task SaveEvaluatorReviewAsync_DoesNotOverwriteSelfRatings()
    {
        using var db = CreateDb();
        db.Evaluations.Add(new Evaluation
        {
            UserId = 7,
            CycleId = 1,
            Competencies = new CompetenciesSection
            {
                TechnicalSkills = new CompetencyRating { SelfRating = 5, SelfEvidence = "Built API" },
                Communication = new CompetencyRating { SelfRating = 4 },
                Leadership = new CompetencyRating { SelfRating = 3 },
                GrowthLearning = new CompetencyRating { SelfRating = 4 },
                Culture = new CompetencyRating { SelfRating = 5 }
            }
        });
        await db.SaveChangesAsync();
        var evalId = db.Evaluations.Single().Id;
        var service = CreateService(db);

        var review = new EvaluatorReviewDto
        {
            Competencies = new EvaluatorCompetenciesSection
            {
                OnlyTechnicalSkills = new EvaluatorRating { EvaluatorRatingValue = 3, EvaluatorNotes = "Good improvement" },
                OnlyCommunication = new EvaluatorRating { EvaluatorRatingValue = 4, EvaluatorNotes = "Clear updates" },
                OnlyLeadership = new EvaluatorRating { EvaluatorRatingValue = 4, EvaluatorNotes = "Stepped up" },
                OnlyGrowthLearning = new EvaluatorRating { EvaluatorRatingValue = 5, EvaluatorNotes = "Fast learner" },
                OnlyCulture = new EvaluatorRating { EvaluatorRatingValue = 5, EvaluatorNotes = "Strong collaborator" }
            }
        };

        await service.SaveEvaluatorReviewAsync(evalId, evaluatorId: 99, review);
        var updated = await db.Evaluations.SingleAsync();

        updated.Competencies.TechnicalSkills.SelfRating.Should().Be(5);
        updated.Competencies.TechnicalSkills.EvaluatorRating.Should().Be(3);
        updated.Competencies.TechnicalSkills.EvaluatorNotes.Should().Be("Good improvement");
    }
}
