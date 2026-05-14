using System.Text;
using System.Net;
using System.IO;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OrkaEval.Api.Data;
using OrkaEval.Api.Services;
using System.Text.Json.Serialization;
using OrkaEval.Api.Models;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.HttpOverrides;
using OrkaEval.Api;

var builder = WebApplication.CreateBuilder(args);

// ── Kestrel Configuration ──────────────────────────────────────────────────
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Dev: bind to localhost:5000 only
        serverOptions.Listen(IPAddress.Loopback, 5000);
    }
    else
    {
        // Production (Render): bind to 0.0.0.0 on the PORT env var (default 10000)
        var port = int.Parse(Environment.GetEnvironmentVariable("PORT") ?? "10000");
        serverOptions.Listen(IPAddress.Any, port);
    }
    
    serverOptions.Limits.MaxRequestHeadersTotalSize = 1048576; // 1MB
});

// ── Database Connection Logic ───────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                    ?? Environment.GetEnvironmentVariable("DATABASE_URL");

if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = "Data Source=orkaeval.db";
}
else if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
{
    // Convert postgres:// URI to Npgsql connection string
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;";
}

var isSqlite = connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);
Console.WriteLine($">>> Database Provider: {(isSqlite ? "SQLite" : "PostgreSQL")}");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isSqlite)
        options.UseSqlite(connectionString);
    else
        options.UseNpgsql(connectionString);

    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

// ── AutoMapper ────────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(Program));

// ── Authentication ────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    // HS256 requires at least 256 bits (32 chars). 
    // If the provided key is too short, we use a secure hardcoded fallback for stability.
    jwtKey = "OrkaEval_Production_Secret_Key_Must_Be_At_Least_32_Chars_Long_12345!";
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "OrkaEval",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "OrkaEvalUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    })
    .AddGoogle(options =>
    {
        var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
        var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

        options.ClientId = string.IsNullOrWhiteSpace(googleClientId) ? "placeholder" : googleClientId;
        options.ClientSecret = string.IsNullOrWhiteSpace(googleClientSecret) ? "placeholder" : googleClientSecret;
        options.CallbackPath = "/api/auth/google/callback";
        options.SaveTokens = true;
        options.Scope.Add("profile");

        options.Events.OnRemoteFailure = async context =>
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "text/plain";
            var errorMsg = $"OAuth Middleware Error: {context.Failure?.Message}\n\nStack Trace:\n{context.Failure?.StackTrace}";
            errorMsg += new string(' ', 1024); // Pad to ensure Chrome doesn't hide it
            await context.Response.WriteAsync(errorMsg);
            context.HandleResponse();
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEvaluationService, EvaluationService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IImageService, CloudinaryService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ── CORS (Production Ready) ───────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:5000",
                "https://frontend-orkaeval.vercel.app"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "OrkaEval API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddHealthChecks();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Static Files Configuration ────────────────────────────────────────────────
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath)) Directory.CreateDirectory(wwwrootPath);

app.UseCors();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(wwwrootPath),
    RequestPath = "",
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    }
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// ── Startup Data Initialization ───────────────────────────────────────────────
try 
{
    await DataInitializer.InitializeAsync(app.Services, app.Environment);
}
catch (Exception ex)
{
    Console.WriteLine($">>> Startup Init Warning: {ex.Message}");
}

Console.WriteLine(">>> App starting...");
app.Run();
