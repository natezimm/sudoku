# Sudoku

This repository contains a Sudoku web application with a client-side Angular frontend and a server-side ASP.NET Core backend.

## Project Structure

- **client/**: Contains the Angular frontend application.
- **server/**: Contains the ASP.NET Core backend application.

## Getting Started

### Prerequisites

- Node.js and npm (for the client)
- .NET SDK (for the server)

### Running the Application

1. **Start the Backend Server**:
   - Navigate to the `server` directory:
     ```bash
     cd server
     ```
   - Run the server:
     ```bash
     dotnet run
     ```
   - The server will be available at [http://localhost:5200](http://_vscodecontentref_/1).

2. **Start the Frontend Client**:
   - Navigate to the [client](http://_vscodecontentref_/2) directory:
     ```bash
     cd client
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm start
     ```
   - Open your browser and navigate to [http://localhost:4200](http://_vscodecontentref_/3).

## Features

- Generate Sudoku puzzles with varying difficulty levels (Easy, Medium, Hard).
- Interactive Sudoku grid with input validation.
- Check solutions and clear inputs.
- Responsive design for a seamless user experience.

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)