using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrkaEval.Api.Services;

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

    [HttpGet("hub/{cycleId}")]
    public async Task<IActionResult> GetHubData(int cycleId)
    {
        var data = await _analyticsService.GetHubDataAsync(cycleId);
        return Ok(data);
    }
}
