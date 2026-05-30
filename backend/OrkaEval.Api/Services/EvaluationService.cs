using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using OrkaEval.Api.Models.DTOs;

namespace OrkaEval.Api.Services;

public interface IEvaluationService
{
    Task<EvaluationDto?> GetMyEvaluationAsync(int userId, int cycleId);
    Task<EvaluationDto> SaveSelfEvaluationAsync(int userId, int cycleId, EvaluationCreateDto dto);
    Task<PagedResult<EvaluationDto>> GetTeamEvaluationsAsync(int cycleId, int currentUserId, int page, int pageSize, string? search);
    Task<EvaluationDto> SaveEvaluatorReviewAsync(int evaluationId, int evaluatorId, EvaluatorReviewDto dto);
    Task<EvaluationDto> CompleteEvaluationAsync(int evaluationId, int actorUserId);
    Task<EvaluationDto> SaveSessionNotesAsync(int evaluationId, int actorUserId, SessionSection session);
    Task<EvaluationDto?> GetEvaluationByIdAsync(int id, int currentUserId);
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class EvaluationService : IEvaluationService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly IAuditService _auditService;

    public EvaluationService(AppDbContext db, IMapper mapper, IEmailService emailService, IAuditService auditService)
    {
        _db = db;
        _mapper = mapper;
        _emailService = emailService;
        _auditService = auditService;
    }

    private async Task<bool> HasAccessToEvaluationAsync(Evaluation eval, int userId)
    {
        if (eval.UserId == userId) return true; // Own evaluation
        var user = await _db.Users.FindAsync(userId);
        if (user?.Role == UserRole.Admin) return true; // Admin access
        
        var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach != null)
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == eval.UserId);
            if (candidate?.CoachId == coach.Id) return true; // Coach access
        }
        return false;
    }

    public async Task<EvaluationDto?> GetMyEvaluationAsync(int userId, int cycleId)
    {
        var eval = await _db.Evaluations
            .Include(e => e.Evaluator)
            .Include(e => e.Cycle)
            .FirstOrDefaultAsync(e => e.UserId == userId && e.CycleId == cycleId);
        return eval is null ? null : _mapper.Map<EvaluationDto>(eval);
    }

    public async Task<EvaluationDto> SaveSelfEvaluationAsync(int userId, int cycleId, EvaluationCreateDto dto)
    {
        var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == userId);
        if (candidate?.CoachId == null && !dto.IsDraft)
        {
            throw new InvalidOperationException("You must select a coach in your profile before submitting your evaluation.");
        }

        var eval = await _db.Evaluations.FirstOrDefaultAsync(e => e.UserId == userId && e.CycleId == cycleId);
        if (eval == null)
        {
            eval = new Evaluation { UserId = userId, CycleId = cycleId };
            _db.Evaluations.Add(eval);
            await _auditService.LogAsync(userId, "EvaluationCreated", $"CycleId={cycleId}");
        }

        _mapper.Map(dto, eval);
        if (!dto.IsDraft)
        {
            eval.Status = EvaluationStatus.SelfCompleted;
        }
        eval.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _auditService.LogAsync(userId, "EvaluationSubmitted", $"EvaluationId={eval.Id};CycleId={cycleId}");

        // Notify the coach when a candidate finalizes their self-evaluation
        if (!dto.IsDraft)
        {
            try
            {
                var candidateWithUser = await _db.Candidates
                    .Include(c => c.User)
                    .FirstOrDefaultAsync(c => c.UserId == userId);
                if (candidateWithUser?.CoachId != null)
                {
                    var coach = await _db.Coaches
                        .Include(c => c.User)
                        .FirstOrDefaultAsync(c => c.Id == candidateWithUser.CoachId);
                    if (coach?.User != null && coach.User.NotificationsEnabled)
                    {
                        var submitterName = candidateWithUser.User?.DisplayName ?? "A team member";
                        _db.Notifications.Add(new Notification
                        {
                            UserId = coach.UserId,
                            Title = "Self-Evaluation Submitted",
                            Message = $"{submitterName} has submitted their self-evaluation for Cycle {cycleId}.",
                            Type = "Evaluation",
                            Link = $"/dashboard?view=team_review&id={eval.Id}",
                            CreatedAt = DateTime.UtcNow
                        });
                        await _db.SaveChangesAsync();
                    }
                }
            }
            catch
            {
                // Do not fail the evaluation save if notification creation fails.
            }
        }

        try
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                if (!string.IsNullOrEmpty(eval.Coaching.Takeaway))
                {
                    await _emailService.SendSessionConfirmationAsync(user.Email, user.DisplayName, "Coaching", eval.Coaching.Takeaway);
                }
                else if (!string.IsNullOrEmpty(eval.OpenDiscussion.Takeaway))
                {
                    await _emailService.SendSessionConfirmationAsync(user.Email, user.DisplayName, "Open Discussion", eval.OpenDiscussion.Takeaway);
                }
            }
        }
        catch
        {
            // Do not fail save when email send fails.
        }

        return _mapper.Map<EvaluationDto>(eval);
    }

    public async Task<PagedResult<EvaluationDto>> GetTeamEvaluationsAsync(int cycleId, int currentUserId, int page, int pageSize, string? search)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : pageSize;
        pageSize = pageSize > 100 ? 100 : pageSize;

        var user = await _db.Users.FindAsync(currentUserId);
        var isAdmin = user?.Role == UserRole.Admin;
        
        var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == currentUserId);
        var query = _db.Evaluations
            .Include(e => e.User)
            .Include(e => e.Cycle)
            .Where(e => (cycleId <= 0 || e.CycleId == cycleId) && (e.Status != EvaluationStatus.Draft || e.UserId == currentUserId));

        if (isAdmin)
        {
            // Admin sees all evaluations, no additional filters needed
        }
        else if (coach != null)
        {
            query = query.Where(e => _db.Candidates.Any(can => can.UserId == e.UserId && can.CoachId == coach.Id));
        }
        else
        {
            // If not a coach or admin, only see own
            query = query.Where(e => e.UserId == currentUserId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();
            query = query.Where(e =>
                (e.User != null && (
                    e.User.DisplayName.ToLower().Contains(normalized) ||
                    e.User.Email.ToLower().Contains(normalized)))
            );
        }

        var totalCount = await query.CountAsync();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var items = await query
            .OrderByDescending(e => e.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<EvaluationDto>
        {
            Items = _mapper.Map<IEnumerable<EvaluationDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<EvaluationDto> SaveEvaluatorReviewAsync(int evaluationId, int evaluatorId, EvaluatorReviewDto dto)
    {
        var eval = await _db.Evaluations.FindAsync(evaluationId) ?? throw new KeyNotFoundException("Evaluation not found.");
        if (!await HasAccessToEvaluationAsync(eval, evaluatorId)) throw new UnauthorizedAccessException("You do not have permission to modify this evaluation.");
        
        eval.EvaluatorId = evaluatorId;
        eval.Status = EvaluationStatus.EvaluatorCompleted;
        eval.UpdatedAt = DateTime.UtcNow;
        eval.Competencies ??= new();

        if (dto.Competencies != null)
        {
            eval.Competencies.TechnicalSkills ??= new();
            eval.Competencies.Communication ??= new();
            eval.Competencies.Leadership ??= new();
            eval.Competencies.GrowthLearning ??= new();
            eval.Competencies.Culture ??= new();

            eval.Competencies.TechnicalSkills.EvaluatorRating = dto.Competencies.OnlyTechnicalSkills.EvaluatorRatingValue;
            eval.Competencies.TechnicalSkills.EvaluatorNotes = dto.Competencies.OnlyTechnicalSkills.EvaluatorNotes;
            eval.Competencies.Communication.EvaluatorRating = dto.Competencies.OnlyCommunication.EvaluatorRatingValue;
            eval.Competencies.Communication.EvaluatorNotes = dto.Competencies.OnlyCommunication.EvaluatorNotes;
            eval.Competencies.Leadership.EvaluatorRating = dto.Competencies.OnlyLeadership.EvaluatorRatingValue;
            eval.Competencies.Leadership.EvaluatorNotes = dto.Competencies.OnlyLeadership.EvaluatorNotes;
            eval.Competencies.GrowthLearning.EvaluatorRating = dto.Competencies.OnlyGrowthLearning.EvaluatorRatingValue;
            eval.Competencies.GrowthLearning.EvaluatorNotes = dto.Competencies.OnlyGrowthLearning.EvaluatorNotes;
            eval.Competencies.Culture.EvaluatorRating = dto.Competencies.OnlyCulture.EvaluatorRatingValue;
            eval.Competencies.Culture.EvaluatorNotes = dto.Competencies.OnlyCulture.EvaluatorNotes;
        }

        await _db.SaveChangesAsync();

        // Notify Candidate
        var candidateUser = await _db.Users.FindAsync(eval.UserId);
        var evaluatorUser = await _db.Users.FindAsync(evaluatorId);
        if (candidateUser != null && candidateUser.NotificationsEnabled)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = eval.UserId,
                Title = "Coach Review Submitted",
                Message = $"Coach {evaluatorUser?.DisplayName} has submitted their review for your evaluation.",
                Type = "Review",
                Link = $"/dashboard?view=results&id={eval.Id}",
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        await _auditService.LogAsync(evaluatorId, "EvaluatorReviewSaved", $"EvaluationId={evaluationId}");
        return _mapper.Map<EvaluationDto>(eval);
    }

    public async Task<EvaluationDto> CompleteEvaluationAsync(int evaluationId, int actorUserId)
    {
        var eval = await _db.Evaluations.FindAsync(evaluationId) ?? throw new KeyNotFoundException("Evaluation not found.");
        if (!await HasAccessToEvaluationAsync(eval, actorUserId)) throw new UnauthorizedAccessException("You do not have permission to modify this evaluation.");
        
        eval.Status = EvaluationStatus.SessionCompleted;
        eval.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _auditService.LogAsync(actorUserId, "SessionCompleted", $"EvaluationId={evaluationId}");
        return _mapper.Map<EvaluationDto>(eval);
    }

    public async Task<EvaluationDto> SaveSessionNotesAsync(int evaluationId, int actorUserId, SessionSection session)
    {
        var eval = await _db.Evaluations.FindAsync(evaluationId) ?? throw new KeyNotFoundException("Evaluation not found.");
        if (!await HasAccessToEvaluationAsync(eval, actorUserId)) throw new UnauthorizedAccessException("You do not have permission to modify this evaluation.");
        
        eval.Session = session;
        eval.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return _mapper.Map<EvaluationDto>(eval);
    }

    public async Task<EvaluationDto?> GetEvaluationByIdAsync(int id, int currentUserId)
    {
        var eval = await _db.Evaluations
            .Include(e => e.User)
            .Include(e => e.Evaluator)
            .Include(e => e.Cycle)
            .FirstOrDefaultAsync(e => e.Id == id);
            
        if (eval == null) return null;
        if (!await HasAccessToEvaluationAsync(eval, currentUserId)) throw new UnauthorizedAccessException("You do not have permission to view this evaluation.");
        
        return _mapper.Map<EvaluationDto>(eval);
    }
}
