# ASP.NET Core Framework Pack

Use this pack when the repository exposes a .NET web app or API through ASP.NET Core.

## Primary signals

- `.csproj` uses `Microsoft.NET.Sdk.Web`
- `Program.cs` uses `WebApplication.CreateBuilder`

## Companion surfaces

- `lang:dotnet`
- service hardening and deployment validation

## Validation cues

- confirm middleware ordering, auth, and DI registrations remain correct
- verify endpoint and startup behavior after transport or config changes
