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
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out .

# Expose the port the app runs on
EXPOSE 5200

# Set the entry point for the container
ENTRYPOINT ["dotnet", "server.dll"]