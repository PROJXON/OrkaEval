using OrkaEval.Api.Models.DTOs;

namespace OrkaEval.Api.Services;

public interface IAnalyticsService
{
    Task<AnalyticsHubDto> GetHubDataAsync(int cycleId);
}
