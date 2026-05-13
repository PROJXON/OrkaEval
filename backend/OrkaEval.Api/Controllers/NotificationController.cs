using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrkaEval.Api.Data;
using OrkaEval.Api.Models;
using System.Security.Claims;

namespace OrkaEval.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _db;

    public NotificationController(AppDbContext db)
    {
        _db = db;
    }

    private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetCurrentUserId();
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _db.SaveChangesAsync();

        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        
        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var userId = GetCurrentUserId();
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification == null) return NotFound();

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync();

        return Ok();
    }
}
