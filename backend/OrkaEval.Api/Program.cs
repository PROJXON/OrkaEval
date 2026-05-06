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

// ── Database ──────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Data Source=orkaeval.db";
}

var isSqlite = connectionString.StartsWith("Data Source=", StringComparison.OrdinalIgnoreCase);

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isSqlite)
        options.UseSqlite(connectionString);
    else
        options.UseNpgsql(connectionString);

    // Suppress pending model changes warning in EF Core 9
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

// ── AutoMapper ────────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(Program));

// ── Authentication ────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
{
    jwtKey = "FallbackSuperSecretKeyForDevEnvironmentsOnly123!@#";
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
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? "placeholder";
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? "placeholder";
        options.CallbackPath = "/api/auth/google/callback";
        options.SaveTokens = true;
        options.Scope.Add("profile");
    });

builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEvaluationService, EvaluationService>();
builder.Services.AddScoped<IImageService, CloudinaryService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// ── CORS (Solid Configuration) ────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allow any local origin
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

var app = builder.Build();

// ── Startup Data Fix ──────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // ── Auto-migrate First ────────────────────────────────────────────────────
    await db.Database.MigrateAsync();

    // ── Schema Fix ────────────────────────────────────────────────────────────
    try {
        await db.Database.ExecuteSqlRawAsync("ALTER TABLE Cycles ADD COLUMN Number INTEGER DEFAULT 1;");
    } catch { /* Column already exists or table busy */ }

    var now = DateTime.UtcNow;
    var candidates = await db.Candidates.ToListAsync();
    foreach (var cand in candidates)
    {
        var latestCycle = await db.Cycles
            .Where(c => c.CandidateId == cand.Id)
            .OrderByDescending(c => c.StartDate)
            .FirstOrDefaultAsync();

        if (latestCycle != null && now > latestCycle.EndDate)
        {
            var currentStart = latestCycle.EndDate;
            var currentNum = latestCycle.Number;
            while (now >= currentStart)
            {
                currentNum++;
                var nextCycle = new Cycle {
                    CandidateId = cand.Id,
                    Number = currentNum,
                    StartDate = currentStart,
                    EndDate = currentStart.AddDays(56)
                };
                db.Cycles.Add(nextCycle);
                currentStart = nextCycle.EndDate;
            }
            await db.SaveChangesAsync();
        }
    }

    var evals = await db.Evaluations.ToListAsync();
    var allCycles = await db.Cycles.ToListAsync();
    foreach (var e in evals)
    {
        var cand = candidates.FirstOrDefault(c => c.UserId == e.UserId);
        if (cand == null) continue;
        var correctCycle = allCycles.FirstOrDefault(c => c.CandidateId == cand.Id && c.StartDate <= e.UpdatedAt && c.EndDate >= e.UpdatedAt);
        if (correctCycle != null && e.CycleId != correctCycle.Id)
        {
            e.CycleId = correctCycle.Id;
        }
    }
    await db.SaveChangesAsync();
}

// ── Middleware ────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Static Files Configuration ──────────────────────────────────────────
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath)) Directory.CreateDirectory(wwwrootPath);
var avatarsPath = Path.Combine(wwwrootPath, "avatars");
if (!Directory.Exists(avatarsPath)) Directory.CreateDirectory(avatarsPath);

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

// Fix legacy roles + seed data (dev only)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.ExecuteSqlRawAsync("UPDATE Users SET Role = 'Candidate' WHERE Role = 'TeamMember'");

    // Only seed default admin user in development
    if (app.Environment.IsDevelopment())
    {
        var email = "jagadeesh.madhineni.projxon@gmail.com";
        var defaultName = "Jagadeesh Madhineni";
        var jagUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        
        if (jagUser == null)
        {
            jagUser = new User
            {
                Email = email,
                DisplayName = defaultName,
                Role = UserRole.Both,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                StartDate = DateTime.UtcNow
            };
            db.Users.Add(jagUser);
            await db.SaveChangesAsync();
        }
        
        if (string.IsNullOrWhiteSpace(jagUser.DisplayName))
        {
            jagUser.DisplayName = defaultName;
        }
        
        if (jagUser.Role != UserRole.Both)
        {
            jagUser.Role = UserRole.Both;
        }
        await db.SaveChangesAsync();

        if (jagUser != null)
        {
            var coach = await db.Coaches.FirstOrDefaultAsync(c => c.UserId == jagUser.Id);
            if (coach == null)
            {
                coach = new Coach { 
                    UserId = jagUser.Id, 
                    FullName = jagUser.DisplayName, 
                    Email = jagUser.Email,
                    StartDate = jagUser.StartDate
                };
                db.Coaches.Add(coach);
            }
            else if (string.IsNullOrWhiteSpace(coach.FullName))
            {
                coach.FullName = jagUser.DisplayName;
            }

            var candidate = await db.Candidates.FirstOrDefaultAsync(c => c.UserId == jagUser.Id);
            if (candidate == null)
            {
                candidate = new Candidate { 
                    UserId = jagUser.Id, 
                    FullName = jagUser.DisplayName, 
                    Email = jagUser.Email,
                    StartDate = jagUser.StartDate,
                    CycleStart = jagUser.StartDate,
                    CycleEnd = jagUser.StartDate.AddDays(56)
                };
                db.Candidates.Add(candidate);
                await db.SaveChangesAsync();
            }
            else if (string.IsNullOrWhiteSpace(candidate.FullName))
            {
                candidate.FullName = jagUser.DisplayName;
            }

            if (candidate != null && !await db.Cycles.AnyAsync(cy => cy.CandidateId == candidate.Id))
            {
                db.Cycles.Add(new Cycle { 
                    CandidateId = candidate.Id, 
                    Number = 1, 
                    StartDate = candidate.CycleStart, 
                    EndDate = candidate.CycleEnd 
                });
            }
            
            await db.SaveChangesAsync();
        }
    }
}

app.Run();
