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
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Security: Create non-root user
RUN groupadd --gid 1654 appgroup && \
    useradd --uid 1654 --gid appgroup --shell /bin/false --create-home appuser

# Security: Set environment variables
ENV ASPNETCORE_URLS=http://+:5200
ENV DOTNET_RUNNING_IN_CONTAINER=true

WORKDIR /app

# Copy published application from build stage
COPY --from=build /out .

# Security: Set ownership and switch to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose only the required port
EXPOSE 5200

# Set the entry point for the container
ENTRYPOINT ["dotnet", "server.dll"]