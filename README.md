# CollabX

A modern platform designed to help developers find teammates for hackathons, create teams, and manage join requests efficiently.

## Features

-   **User Authentication**: Secure registration and login.
-   **Profile Management**: Showcase skills, achievements, and professional details.
-   **Hackathon Management**: Explore and organize hackathons.
-   **Team Management**: Form teams, manage members, and handle real-time requests.
-   **Team Finder**: Smart matching for teammates based on skills.

## Tech Stack

-   **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7
-   **Backend**: Node.js, Express.js
-   **Database**: Supabase (PostgreSQL)
-   **Authentication**: JWT & Bcrypt

## Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   Supabase Account

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Hackathon_Project
    ```

2.  **Install dependencies:**
    ```bash
    npm run install-all
    ```
    This command installs dependencies for both the server and the client.

## Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
SECRET_KEY=your_super_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Running the Application

To run both the backend server and the frontend client concurrently:

```bash
npm run dev
```

-   **Server**: Runs on `http://localhost:5000`
-   **Client**: Runs on `http://localhost:5173` (default Vite port)

## API Endpoints

### Auth
-   `POST /api/auth/register` - Register a new user
-   `POST /api/auth/login` - Login user
-   `PUT /api/auth/profile` - Update user profile
-   `GET /api/auth/me` - Get current user details

### Hackathons
-   `GET /api/hackathons` - List all hackathons
-   `POST /api/hackathons` - Create a new hackathon
-   `GET /api/hackathons/:id` - Get hackathon details
-   `DELETE /api/hackathons/:id` - Delete a hackathon

### Teams
-   `GET /api/hackathons/:id/teams` - Get teams for a hackathon
-   `POST /api/hackathons/:id/teams` - Create a team
-   `POST /api/teams/:id/join` - Request to join a team
-   `GET /api/teams/:id/requests` - Get join requests for a team
-   `PUT /api/teams/:id/requests/:requestId` - Approve/Reject a request
-   `PUT /api/teams/:id` - Update team details
-   `DELETE /api/teams/:id` - Delete a team
