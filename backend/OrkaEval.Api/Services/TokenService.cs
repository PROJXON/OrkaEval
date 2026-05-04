using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using OrkaEval.Api.Models;

namespace OrkaEval.Api.Services;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user)
    {
        var jwtSection = _config.GetSection("Jwt");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
        var issuer = jwtSection["Issuer"] ?? "OrkaEval";
        var audience = jwtSection["Audience"] ?? "OrkaEvalUsers";
        var expiryMinutes = int.TryParse(jwtSection["ExpiryMinutes"], out var mins) ? mins : 60 * 24 * 7;

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new("avatar", user.AvatarUrl ?? ""),
        };

        if (user.Role == UserRole.Both)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Candidate"));
            claims.Add(new Claim(ClaimTypes.Role, "Coach"));
        }
        else
        {
            claims.Add(new Claim(ClaimTypes.Role, user.Role.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
