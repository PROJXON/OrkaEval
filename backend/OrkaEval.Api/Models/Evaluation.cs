using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrkaEval.Api.Models;

public enum EvaluationStatus
{
    Draft,
    SelfCompleted,
    EvaluatorCompleted,
    SessionCompleted
}

public class Evaluation
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }
    public User? User { get; set; }

    [Required]
    public int CycleId { get; set; }
    public Cycle? Cycle { get; set; }

    public int? EvaluatorId { get; set; }
    public User? Evaluator { get; set; }

    public EvaluationStatus Status { get; set; } = EvaluationStatus.Draft;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // --- JSON Sections ---

    // 1. Open Discussion
    public OpenDiscussionSection OpenDiscussion { get; set; } = new();

    // 2. Check-In
    public CheckInSection CheckIn { get; set; } = new();

    // 3. Coaching Focus
    public CoachingSection Coaching { get; set; } = new();

    // 4. Competency Ratings (5 areas)
    public CompetenciesSection Competencies { get; set; } = new();

    // 5. Reflection & Goals
    public ReflectionSection Reflection { get; set; } = new();

    // 6. Joint Review Session Data
    public SessionSection Session { get; set; } = new();
}

// --- JSON Owned Types ---

public class SessionSection
{
    public string? IcebreakerTeamMember { get; set; }
    public string? IcebreakerEvaluator { get; set; }
    public string? ActionPlanGoal1 { get; set; }
    public string? ActionPlanGoal2 { get; set; }
    public string? ActionPlanGoal3 { get; set; }
    public string? ActionPlanDates { get; set; }
    public string? AgreedGoals { get; set; }
    public string? KeyTakeaways { get; set; }
    public string? NextSteps { get; set; }
    public int? SessionRating { get; set; }
    public string? SessionFormat { get; set; } // "in-person" | "hybrid" | "virtual"
    public DateTime? CompletedAt { get; set; }
}

public class OpenDiscussionSection
{
    public string? RoleTrack { get; set; }
    public string? ReviewPeriod { get; set; }
    public string? TopOfMind { get; set; }
    public string? Notes { get; set; }
    public string? SessionStatus { get; set; } // "Completed", "Ended Early", etc.
    public string? IceBreaker { get; set; }
    public string? Takeaway { get; set; }
}

public class CheckInSection
{
    public List<string> MoodEmojis { get; set; } = new();
    public string? WhyFeeling { get; set; }
    public int StressLevel { get; set; } = 5;
    public string? BiggestWin { get; set; }
    public string? Wellbeing { get; set; }
}

public class CoachingSection
{
    // Pulse Check
    public List<string> MoodEmojis { get; set; } = new();
    public string? EmojiWhy { get; set; }
    public int BandwidthLevel { get; set; } = 5;
    public string? Navigating { get; set; }
    public string? JoyThing { get; set; }
    public string? WeekWin { get; set; }

    // Purpose & Alignment
    public string? PurposeNow { get; set; }
    public string? Alignment { get; set; }
    public string? GoalsFocused { get; set; }
    public string? ProjGoals { get; set; }
    public string? DesiredImpact { get; set; }
    public string? FiveYear { get; set; }

    // Projects & Execution
    public string? Meaningful { get; set; }
    public string? Avoiding { get; set; }
    public string? NoValue { get; set; }
    public string? MoveForward { get; set; }
    public string? Autonomy { get; set; }

    // Professional Development
    public List<string> DevelopmentTopics { get; set; } = new();
    public string? Communication { get; set; }
    public string? ProfDevTopic { get; set; }
    public string? ProfFeedback { get; set; }
    public string? Etiquette { get; set; }
    public string? Certifications { get; set; }

    // Personal Growth
    public string? ProudOf { get; set; }
    public string? WinPossible { get; set; }
    public string? FeedbackReceived { get; set; }
    public string? Stretch { get; set; }

    // Issue Resolution
    public string? Challenge { get; set; }
    public string? Tried { get; set; }
    public string? TeamSupport { get; set; }
    public string? EasierSupport { get; set; }

    // Closing
    public string? AnythingElse { get; set; }
    public string? Acknowledgement { get; set; }
    public string? Takeaway { get; set; }
    public string? NextSteps { get; set; }
    public int? SessionRating { get; set; }
    public string? RatingWhy { get; set; }
}

public class CompetenciesSection
{
    public CompetencyRating TechnicalSkills { get; set; } = new();
    public CompetencyRating Communication { get; set; } = new();
    public CompetencyRating Leadership { get; set; } = new();
    public CompetencyRating GrowthLearning { get; set; } = new();
    public CompetencyRating Culture { get; set; } = new();
}

public class CompetencyRating
{
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int? SelfRating { get; set; }

    [MaxLength(2000)]
    public string? SelfEvidence { get; set; }
    public string? SelfAction { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int? EvaluatorRating { get; set; }

    [MaxLength(2000)]
    public string? EvaluatorNotes { get; set; }
}

public class ReflectionSection
{
    public string? GreatestAchievement { get; set; }
    public string? BiggestChallenge { get; set; }
    public string? DoDifferently { get; set; }
    public string? SupervisorSupport { get; set; }
    
    public string? Goal1 { get; set; }
    public string? Goal2 { get; set; }
    public string? Goal3 { get; set; }
    public string? PriorityCompetency { get; set; }
    public string? Comments { get; set; }
}
