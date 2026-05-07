namespace OrkaEval.Api.Models.DTOs;

public class AnalyticsHubDto
{
    public List<CompetencyAverageDto> CompetencyHeatmap { get; set; } = new();
    public SubmissionStatsDto SubmissionStats { get; set; } = new();
    public List<GrowthDeltaDto> GrowthTrends { get; set; } = new();
}

public class CompetencyAverageDto
{
    public string Name { get; set; } = string.Empty;
    public double AverageRating { get; set; }
}

public class SubmissionStatsDto
{
    public int TotalCandidates { get; set; }
    public int Completed { get; set; }
    public int InProgress { get; set; }
    public int NotStarted { get; set; }
}

public class GrowthDeltaDto
{
    public int CycleNumber { get; set; }
    public double AverageOverallScore { get; set; }
}
