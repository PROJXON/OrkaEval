using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using System.Security.Claims;

namespace OrkaEval.Api.Controllers;

[ApiController]
[Route("api/forms")]
[Authorize]
public class FormController : ControllerBase
{
    private readonly AppDbContext _db;

    public FormController(AppDbContext db)
    {
        _db = db;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitForm([FromBody] FormSubmissionRequest req)
    {
        var userId = GetCurrentUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        // Determine Candidate and Coach IDs
        int candidateId;
        int? coachId = null;

        if (user.Role == UserRole.Coach)
        {
            if (req.CandidateId == null) return BadRequest(new { message = "Candidate selection is required for coaches." });
            candidateId = req.CandidateId.Value;
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
            coachId = coach?.Id;
        }
        else
        {
            // Candidate submitting their own form (Performance Review)
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null) return BadRequest(new { message = "Candidate record not found." });
            candidateId = candidate.Id;
            coachId = candidate.CoachId;
        }

        // Get current cycle for the candidate
        var now = DateTime.UtcNow;
        var cycle = await _db.Cycles
            .Where(c => c.CandidateId == candidateId && c.StartDate <= now && c.EndDate >= now)
            .OrderByDescending(c => c.StartDate)
            .FirstOrDefaultAsync();

        var submission = new FormSubmission
        {
            CandidateId = candidateId,
            CoachId = coachId,
            FormType = req.FormType,
            FormData = req.FormData,
            SubmittedAt = now,
            CycleId = cycle?.Id
        };

        _db.FormSubmissions.Add(submission);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Form submitted successfully.", id = submission.Id });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int? candidateId = null)
    {
        var userId = GetCurrentUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        IQueryable<FormSubmission> query = _db.FormSubmissions
            .Include(s => s.Candidate);

        if (user.Role == UserRole.Coach)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
            if (coach == null) return Unauthorized();
            query = query.Where(s => s.CoachId == coach.Id);
            if (candidateId != null) query = query.Where(s => s.CandidateId == candidateId);
        }
        else
        {
            var candidate = await _db.Candidates.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null) return Unauthorized();
            query = query.Where(s => s.CandidateId == candidate.Id);
        }

        // Get regular form submissions
        var historyData = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new {
                s.Id,
                FormType = s.FormType,
                SubmittedAt = s.SubmittedAt,
                CandidateName = s.Candidate!.FullName,
                CycleId = s.CycleId,
                IsEvaluation = false,
                CandidateId = s.CandidateId
            })
            .ToListAsync();

        // Get formal evaluations
        var evalQuery = _db.Evaluations.Include(e => e.User).Include(e => e.Cycle).AsQueryable();
        if (user.Role == UserRole.Coach)
        {
            var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
            if (coach != null)
            {
                evalQuery = evalQuery.Where(e => _db.Candidates.Any(c => c.UserId == e.UserId && c.CoachId == coach.Id));
                if (candidateId != null) 
                {
                    var targetCandidate = await _db.Candidates.FindAsync(candidateId);
                    if (targetCandidate != null) evalQuery = evalQuery.Where(e => e.UserId == targetCandidate.UserId);
                }
            }
        }
        else
        {
            evalQuery = evalQuery.Where(e => e.UserId == userId);
        }

        // Only include formal evaluations that have been submitted (not drafts)
        evalQuery = evalQuery.Where(e => e.Status != EvaluationStatus.Draft);

        var evalData = await evalQuery
            .OrderByDescending(e => e.UpdatedAt)
            .Select(e => new {
                e.Id,
                FormType = "Performance Review",
                SubmittedAt = e.UpdatedAt,
                CandidateName = e.User != null ? e.User.DisplayName : "Unknown",
                CycleId = e.CycleId,
                IsEvaluation = true,
                UserId = e.UserId,
                Status = e.Status.ToString(),
                CycleNumber = e.Cycle != null ? e.Cycle.Number : 0
            })
            .ToListAsync();

        // Fetch all cycles for candidates involved to calculate sequence numbers
        var allCandidateIds = historyData.Select(h => h.CandidateId).Distinct().ToList();
        var allUserIds = evalData.Select(e => e.UserId).Distinct().ToList();
        
        var relevantCycles = await _db.Cycles
            .Where(c => allCandidateIds.Contains(c.CandidateId) || _db.Candidates.Any(can => allUserIds.Contains(can.UserId) && can.Id == c.CandidateId))
            .OrderBy(c => c.StartDate)
            .ToListAsync();

        var candidateMap = await _db.Candidates.Where(c => allUserIds.Contains(c.UserId)).ToDictionaryAsync(c => c.UserId, c => c.Id);

        Func<int, int?, int> getCycleNum = (candId, cycId) => {
            if (cycId == null) return 0;
            return relevantCycles.Where(c => c.CandidateId == candId && c.StartDate <= relevantCycles.First(rc => rc.Id == cycId).StartDate).Count();
        };

        var history = historyData.Select(s => new {
            s.Id, s.FormType, s.SubmittedAt, s.CandidateName,
            CycleNumber = getCycleNum(s.CandidateId, s.CycleId),
            s.IsEvaluation,
            Status = "Submitted"
        });

        var evals = evalData.Select(e => new {
            e.Id, e.FormType, e.SubmittedAt, e.CandidateName,
            CycleNumber = e.CycleNumber,
            e.IsEvaluation,
            Status = e.Status
        });

        var combined = history.Cast<object>().Concat(evals.Cast<object>())
            .OrderByDescending(x => (DateTime)((dynamic)x).SubmittedAt)
            .ToList();

        return Ok(combined);
    }

    [HttpGet("candidates")]
    [Authorize(Roles = "Coach,Admin,Both")]
    public async Task<IActionResult> GetCandidates()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        var coach = await _db.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);
        if (coach == null) return Ok(new List<object>()); // Return empty if not a coach

        // For coaches to select their team members
        var candidates = await _db.Candidates
            .Where(c => c.CoachId == coach.Id)
            .Select(c => new {
                c.Id,
                c.FullName,
                c.Email,
                c.StartDate,
                c.CycleStart,
                c.CycleEnd
            })
            .ToListAsync();

        return Ok(candidates);
    }
}

public class FormSubmissionRequest
{
    public int? CandidateId { get; set; }
    public string FormType { get; set; } = string.Empty;
    public string FormData { get; set; } = "{}";
}
