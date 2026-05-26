# EcoRun Seville

Gamified eco-running social platform that incentivizes sustainable transportation in Seville. Users earn **EcoPoints** for every kilometer run, contributing to reducing CO₂ emissions and reforesting the planet.

---

## Tech stack

### Frontend
| Technology | Version |
|---|---|
| React | 19.2.5 |
| Vite | 8.0.10 |
| React Router DOM | 7.14.2 |
| Tailwind CSS | 3.4.19 |
| Framer Motion | 12.38.0 |
| Axios | 1.16.0 |
| Lucide React | 1.14.0 |

### Backend
| Technology | Version |
|---|---|
| Node.js + Express | 5.2.1 |
| MySQL 2 | 3.16.3 |
| JWT | 9.0.3 |
| bcryptjs | 3.0.3 |
| Express Validator | 7.3.1 |
| Helmet | 8.1.0 |
| Jest + Supertest | 29.7.0 |

---

## Features

- **Authentication** — Registration and login with JWT and bcrypt-hashed passwords
- **Run tracking** — Record distance, duration, start/end time and points earned
- **Challenge system** — Challenges across Seville zones (Norte, Sur, Centro, Triana, Este) with categories, difficulty and rewards
- **Gamification** — EcoPoints, user levels (1-7+), achievements and leaderboard
- **Environmental impact** — Visualization of trees saved, CO₂ avoided and total kilometers
- **Challenge map** — Geographic view of active challenges across Seville

---

## Project structure

```
ecorun/
├── ecorunfrontend/          # React application
│   ├── src/
│   │   ├── pages/           # Views: Home, Login, Register, Dashboard, Challenges, Map
│   │   ├── components/
│   │   │   ├── ui/          # Button, Input, Badge, ProgressBar, LoadingSpinner
│   │   │   ├── layout/      # Navbar, Footer
│   │   │   └── shared/      # Reusable components
│   │   ├── layouts/         # PublicLayout, AuthLayout, AppLayout
│   │   ├── context/         # AuthContext (global auth state)
│   │   ├── services/        # api.js, authService.js, challengeService.js
│   │   ├── hooks/           # Custom hooks
│   │   ├── data/            # Mock data for development
│   │   └── utils/           # Utility functions
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── ecorunbackend/           # Node.js REST API
    ├── src/
    │   ├── config/db.js     # MySQL connection (pool of 10 connections)
    │   └── middleware/      # authMiddleware, errorHandler, validation
    ├── models/              # UserModel, RunModel, ChallengeModel
    ├── controllers/         # AuthController, RunController, ChallengeController
    ├── services/            # AuthService, RunService, ChallengeService
    ├── routes/              # auth.js, runs.js, challenges.js
    ├── tests/               # Jest + Supertest
    ├── postman_collection.json
    └── server.js
```

---

## Installation and setup

### Prerequisites
- Node.js >= 18
- MySQL >= 8.0 (database managed locally)

### 1. Backend

```bash
cd ecorunbackend
npm install
```

Create the `.env` file from the example:

```bash
cp .env.example .env
```

```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecorun_sevilla
DB_PORT=3306

JWT_SECRET=change_this_to_a_secure_secret
```

Start the server:

```bash
npm run dev       # development (nodemon)
npm start         # production
```

Server runs at `http://localhost:8080`.

### 2. Frontend

```bash
cd ecorunfrontend
npm install
```

Create the `.env` file:

```env
VITE_API_URL=http://localhost:8080/api
```

Start the application:

```bash
npm run dev
```

App available at `http://localhost:5173`.

---

## Available scripts

### Frontend
| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint with ESLint |

### Backend
| Command | Description |
|---|---|
| `npm run dev` | Server with hot-reload (nodemon) |
| `npm start` | Production server |
| `npm test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |

---

## API Endpoints

### Authentication — `/api/auth`
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/register` | Create new account | No |
| POST | `/login` | Sign in | No |

### Runs — `/api/runs`
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | `/` | Create run | Yes |
| GET | `/user/:userId` | User's runs | Yes |
| GET | `/:id` | Run detail | Yes |
| PUT | `/:id` | Update run | Yes |
| DELETE | `/:id` | Delete run | Yes |

### Challenges — `/api/challenges`
| Method | Route | Description | Auth |
|---|---|---|---|
| GET | `/` | List active challenges | No |
| GET | `/:id` | Challenge detail | No |
| GET | `/user/:userId` | User's challenges | Yes |
| POST | `/:id/join` | Join a challenge | Yes |
| PUT | `/user/:userChallengeId/progress` | Update progress | Yes |

> Full API documentation available in `ecorunbackend/postman_collection.json`.

---

## Database

```
users
  id, username, email, password_hash, eco_points, role, created_at

runs
  id, user_id, run_name, description, distance_km, duration_minutes
  start_time, end_time, run_date, points_earned, created_at

challenges
  id, name, description, goal_type, goal_value, reward_points
  difficulty, category, start_date, end_date, active

user_challenges
  id, user_id, challenge_id, status, progress, joined_at
```

---

## Environment variables

### Frontend (`.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | API base URL | `http://localhost:3000/api` |

### Backend (`.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port |
| `NODE_ENV` | Environment (`development` / `production`) |
| `FRONTEND_URL` | Frontend URL (CORS) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `DB_PORT` | MySQL port |
| `JWT_SECRET` | Secret for signing JWT tokens |

---

## Application routes

| Route | View | Access |
|---|---|---|
| `/` | Home | Public |
| `/login` | Sign in | Unauthenticated only |
| `/register` | Sign up | Unauthenticated only |
| `/dashboard` | User dashboard | Requires auth |
| `/challenges` | Challenge list | Requires auth |
| `/map` | Challenge map | Requires auth |

---

## Security

- Passwords hashed with **bcryptjs**
- Session tokens with **JWT** (configurable expiration)
- HTTP headers secured with **Helmet**
- CORS protection restricted to the frontend
- Input validation with **express-validator**
- Sensitive variables managed by `.env` (never in the repository)

---

## License

Educational project — 2nd year Web Application Development
