using MailKit.Net.Smtp;
using MimeKit;

namespace OrkaEval.Api.Services;

public interface IEmailService
{
    Task SendSessionConfirmationAsync(string userEmail, string userName, string programName, string notes);
}

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _config;

    public EmailService(ILogger<EmailService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public async Task SendSessionConfirmationAsync(string userEmail, string userName, string programName, string notes)
    {
        var host = _config["Email:SmtpHost"] ?? "smtp.gmail.com";
        var port = int.TryParse(_config["Email:SmtpPort"], out var parsedPort) ? parsedPort : 587;
        var user = _config["Email:Username"] ?? "";
        var pass = _config["Email:Password"] ?? "";
        var from = _config["Email:FromAddress"] ?? "noreply@orkaeval.com";

        if (string.IsNullOrWhiteSpace(user))
        {
            _logger.LogWarning("Email not configured, skipping send.");
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("OrkaEval", from));
        message.To.Add(new MailboxAddress(userName, userEmail));
        message.Subject = $"Session Confirmation: {programName}";
        message.Body = new TextPart("html")
        {
            Text = BuildEmailHtml(userName, programName, notes)
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(user, pass);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static string BuildEmailHtml(string name, string program, string notes) => $@"
<!DOCTYPE html>
<html>
<body style='font-family: Inter, sans-serif; background: #f5f5f5; padding: 40px;'>
  <div style='background: white; border-radius: 12px; padding: 40px; max-width: 600px; margin: 0 auto;'>
    <h1 style='color: #00BFA5;'>OrkaEval</h1>
    <h2>Session Confirmation</h2>
    <p>Hello {name},</p>
    <p>Your <strong>{program}</strong> session has been recorded on {DateTime.Now:MMMM d, yyyy}.</p>
    <div style='background:#f0faf9;border-left:4px solid #00BFA5;padding:16px;border-radius:4px;margin:24px 0;'>
      <strong>Key Takeaways:</strong><br/>{notes}
    </div>
    <p style='color:#888;font-size:12px;'>Projxon OrkaEval - Momentum Internship Program</p>
  </div>
</body>
</html>";
}
