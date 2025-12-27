# Use the official .NET SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy the project files
COPY *.csproj ./
RUN dotnet restore

# Copy the rest of the application files
COPY . ./
RUN dotnet publish -c Release -o /out

# Use the runtime image to run the application
# Using chiseled image for smaller attack surface (no shell, no package manager)
FROM mcr.microsoft.com/dotnet/aspnet:8.0-noble-chiseled AS runtime

# Security: Set environment variables
ENV ASPNETCORE_URLS=http://+:5200
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

WORKDIR /app

# Copy published application from build stage
COPY --from=build /out .

# Security: Expose only the required port
EXPOSE 5200

# Security: Run as non-root user (chiseled images use non-root by default)
# The chiseled image already runs as the 'app' user (UID 1654)

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["dotnet", "--info"] || exit 1

# Set the entry point for the container
ENTRYPOINT ["dotnet", "server.dll"]