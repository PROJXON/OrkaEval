using OrkaEval.Api.Models;

namespace OrkaEval.Api.Models.DTOs;

public class EvaluationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public UserDto? User { get; set; }
    public int CycleId { get; set; }
    public int CycleNumber { get; set; }
    public int? EvaluatorId { get; set; }
    public EvaluationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public OpenDiscussionSection OpenDiscussion { get; set; } = new();
    public CheckInSection CheckIn { get; set; } = new();
    public CoachingSection Coaching { get; set; } = new();
    public CompetenciesSection Competencies { get; set; } = new();
    public ReflectionSection Reflection { get; set; } = new();
    public SessionSection Session { get; set; } = new();
}

public class EvaluationCreateDto
{
    public OpenDiscussionSection? OpenDiscussion { get; set; }
    public CheckInSection? CheckIn { get; set; }
    public CoachingSection? Coaching { get; set; }
    public CompetenciesSection? Competencies { get; set; }
    public ReflectionSection? Reflection { get; set; }
    public SessionSection? Session { get; set; }
    public bool IsDraft { get; set; }
}

public class EvaluatorReviewDto
{
    public EvaluatorCompetenciesSection? Competencies { get; set; }
}

// Strict subsets to ensure coaches don't maliciously overwrite SelfRatings
public class EvaluatorCompetenciesSection
{
    public EvaluatorRating OnlyTechnicalSkills { get; set; } = new();
    public EvaluatorRating OnlyCommunication { get; set; } = new();
    public EvaluatorRating OnlyLeadership { get; set; } = new();
    public EvaluatorRating OnlyGrowthLearning { get; set; } = new();
    public EvaluatorRating OnlyCulture { get; set; } = new();
}

public class EvaluatorRating
{
    public int? EvaluatorRatingValue { get; set; }
    public string? EvaluatorNotes { get; set; }
}
