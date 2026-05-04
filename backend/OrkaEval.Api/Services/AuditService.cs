using OrkaEval.Api.Data;
using OrkaEval.Api.Models;

namespace OrkaEval.Api.Services;

public interface IAuditService
{
    Task LogAsync(int userId, string action, string? details = null);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(int userId, string action, string? details = null)
    {
        var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
        var entry = new AuditLog
        {
            UserId = userId,
            Action = action,
            Details = details,
            IpAddress = ipAddress
        };

        _db.Set<AuditLog>().Add(entry);
        await _db.SaveChangesAsync();
    }
}
