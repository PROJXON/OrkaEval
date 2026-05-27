using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrkaEval.Api.Services;
using System.Security.Claims;

namespace OrkaEval.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Roles = "Coach,Admin,Both")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

    [HttpGet("hub/{cycleId}")]
    public async Task<IActionResult> GetHubData(int cycleId)
    {
        var data = await _analyticsService.GetHubDataAsync(cycleId, GetCurrentUserId());
        return Ok(data);
    }
}
