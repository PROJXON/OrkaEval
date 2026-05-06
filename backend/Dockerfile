FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["OrkaEval.Api/OrkaEval.Api.csproj", "OrkaEval.Api/"]
RUN dotnet restore "OrkaEval.Api/OrkaEval.Api.csproj"
COPY . .
WORKDIR "/src/OrkaEval.Api"
RUN dotnet build "OrkaEval.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "OrkaEval.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OrkaEval.Api.dll"]
