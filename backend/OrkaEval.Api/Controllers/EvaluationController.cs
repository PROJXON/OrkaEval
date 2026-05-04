using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrkaEval.Api.Models;
using OrkaEval.Api.Models.DTOs;
using OrkaEval.Api.Services;

namespace OrkaEval.Api.Controllers;

[ApiController]
[Route("api/evaluations")]
[Authorize]
public class EvaluationController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationController(IEvaluationService evaluationService)
    {
        _evaluationService = evaluationService;
    }

    private int GetCurrentUserId() => 
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Team Member: Get Own Evaluation ───────────────────────────────────────
    [HttpGet("cycle/{cycleId}")]
    public async Task<ActionResult<EvaluationDto>> GetMyEvaluation(int cycleId)
    {
        var userId = GetCurrentUserId();
        var eval = await _evaluationService.GetMyEvaluationAsync(userId, cycleId);
        if (eval is null)
            return Ok(null);
        return Ok(eval);
    }

    // ── Team Member: Save Self-Evaluation ─────────────────────────────────────
    [HttpPost("cycle/{cycleId}")]
    public async Task<ActionResult<EvaluationDto>> SaveSelfEvaluation(int cycleId, [FromBody] EvaluationCreateDto request)
    {
        var userId = GetCurrentUserId();
        var saved = await _evaluationService.SaveSelfEvaluationAsync(userId, cycleId, request);
        return Ok(saved);
    }

    // ── Evaluator: Get All Evaluations to Review ──────────────────────────────
    [HttpGet("team/{cycleId}")]
    [Authorize(Roles = "Coach,Admin,Both")]
    public async Task<IActionResult> GetTeamEvaluations(
        int cycleId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _evaluationService.GetTeamEvaluationsAsync(cycleId, currentUserId, page, pageSize, search);
        return Ok(new
        {
            items = result.Items,
            totalCount = result.TotalCount,
            page = result.Page,
            pageSize = result.PageSize,
            totalPages = result.TotalPages
        });
    }

    // ── Evaluator: Save Evaluator Review ──────────────────────────────────────
    [HttpPut("{id}/evaluator")]
    [Authorize(Roles = "Coach,Admin,Both")]
    public async Task<ActionResult<EvaluationDto>> SaveEvaluatorReview(int id, [FromBody] EvaluatorReviewDto request)
    {
        var evaluatorId = GetCurrentUserId();
        try
        {
            var saved = await _evaluationService.SaveEvaluatorReviewAsync(id, evaluatorId, request);
            return Ok(saved);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Complete / Finalize Evaluation (Joint Session sign-off) ───────────────
    [HttpPost("{id}/complete")]
    [Authorize(Roles = "Coach,Admin,Both")]
    public async Task<ActionResult<EvaluationDto>> CompleteEvaluation(int id)
    {
        var actorId = GetCurrentUserId();
        try
        {
            var completed = await _evaluationService.CompleteEvaluationAsync(id, actorId);
            return Ok(completed);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    // ── Joint Session: Save Session Notes ──────────────────────────────────────
    [HttpPut("{id}/session")]
    [Authorize(Roles = "Coach,Admin,Both")]
    public async Task<ActionResult<EvaluationDto>> SaveSessionNotes(int id, [FromBody] SessionSection session)
    {
        var actorId = GetCurrentUserId();
        try
        {
            var saved = await _evaluationService.SaveSessionNotesAsync(id, actorId, session);
            return Ok(saved);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EvaluationDto>> GetById(int id)
    {
        var eval = await _evaluationService.GetEvaluationByIdAsync(id);
        if (eval is null) return NotFound();
        return Ok(eval);
    }

}
