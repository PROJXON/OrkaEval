using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using OrkaEval.Api.Models.DTOs;

namespace OrkaEval.Api.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<AnalyticsHubDto> GetHubDataAsync(int cycleId)
    {
        var hub = new AnalyticsHubDto();

        // 1. Competency Heatmap (Average of Evaluator Ratings in the specified cycle)
        var evalsInCycle = await _db.Evaluations
            .Where(e => e.CycleId == cycleId && e.Status >= EvaluationStatus.EvaluatorCompleted)
            .ToListAsync();

        hub.CompetencyHeatmap = new List<CompetencyAverageDto>
        {
            new() { Name = "Technical Skills", AverageRating = CalculateAverage(evalsInCycle, "technical") },
            new() { Name = "Communication", AverageRating = CalculateAverage(evalsInCycle, "communication") },
            new() { Name = "Leadership", AverageRating = CalculateAverage(evalsInCycle, "leadership") },
            new() { Name = "Growth & Learning", AverageRating = CalculateAverage(evalsInCycle, "growth") },
            new() { Name = "Culture", AverageRating = CalculateAverage(evalsInCycle, "culture") }
        };

        // 2. Submission Stats
        var totalCandidates = await _db.Candidates.CountAsync();
        var evals = await _db.Evaluations.Where(e => e.CycleId == cycleId).ToListAsync();

        hub.SubmissionStats = new SubmissionStatsDto
        {
            TotalCandidates = totalCandidates,
            Completed = evals.Count(e => e.Status == EvaluationStatus.SessionCompleted),
            InProgress = evals.Count(e => e.Status == EvaluationStatus.SelfCompleted || e.Status == EvaluationStatus.EvaluatorCompleted),
            NotStarted = totalCandidates - evals.Count(e => e.Status != EvaluationStatus.Draft)
        };

        // 3. Growth Trends (Average score per cycle)
        var allEvals = await _db.Evaluations
            .Where(e => e.Status >= EvaluationStatus.EvaluatorCompleted)
            .Include(e => e.Cycle)
            .ToListAsync();

        hub.GrowthTrends = allEvals
            .GroupBy(e => e.Cycle.Number)
            .Select(g => new GrowthDeltaDto
            {
                CycleNumber = g.Key,
                AverageOverallScore = Math.Round(g.Average(e => CalculateOverallScore(e)), 2)
            })
            .OrderBy(g => g.CycleNumber)
            .ToList();

        return hub;
    }

    private double CalculateAverage(List<Evaluation> evals, string competency)
    {
        if (!evals.Any()) return 0;
        var scores = evals.Select(e => competency switch
        {
            "technical" => e.Competencies.TechnicalSkills.EvaluatorRating ?? 0,
            "communication" => e.Competencies.Communication.EvaluatorRating ?? 0,
            "leadership" => e.Competencies.Leadership.EvaluatorRating ?? 0,
            "growth" => e.Competencies.GrowthLearning.EvaluatorRating ?? 0,
            "culture" => e.Competencies.Culture.EvaluatorRating ?? 0,
            _ => 0
        }).Where(s => s > 0).ToList();

        return scores.Any() ? Math.Round(scores.Average(), 2) : 0;
    }

    private double CalculateOverallScore(Evaluation e)
    {
        var scores = new List<int?> {
            e.Competencies.TechnicalSkills.EvaluatorRating,
            e.Competencies.Communication.EvaluatorRating,
            e.Competencies.Leadership.EvaluatorRating,
            e.Competencies.GrowthLearning.EvaluatorRating,
            e.Competencies.Culture.EvaluatorRating
        }.Where(s => s.HasValue && s.Value > 0).ToList();

        return scores.Any() ? scores.Average(s => s.Value) : 0;
    }
}
