# NestJS API with Prisma and MySQL

A production-ready NestJS backend application with Swagger documentation, Prisma ORM, and MySQL database.

## 🚀 Features

- **NestJS Framework** - Progressive Node.js framework
- **Prisma ORM** - Next-generation database toolkit
- **MySQL Database** - Reliable relational database
- **Swagger/OpenAPI** - Interactive API documentation
- **TypeScript** - Type-safe development
- **Validation** - Request validation with class-validator
- **Error Handling** - Global exception filters
- **CORS** - Cross-origin resource sharing enabled

## 📁 Project Structure

```
api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── common/                # Common utilities
│   │   ├── filters/           # Exception filters
│   │   └── interceptors/      # Response interceptors
│   ├── modules/               # Feature modules
│   │   ├── users/             # Users module
│   │   │   ├── dto/           # Data transfer objects
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   └── posts/             # Posts module
│   │       ├── dto/
│   │       ├── posts.controller.ts
│   │       ├── posts.service.ts
│   │       └── posts.module.ts
│   ├── prisma/                # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.controller.ts      # Root controller
│   ├── app.service.ts         # Root service
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript configuration
└── nest-cli.json              # NestJS CLI configuration
```

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 📦 Installation

1. **Clone the repository or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your MySQL credentials:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   PORT=3000
   NODE_ENV=development
   ```

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run prisma:seed
   ```

## 🚀 Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🔗 API Endpoints

### Health Check
- `GET /api/v1` - Welcome message
- `GET /api/v1/health` - Health status

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Posts
- `GET /api/v1/posts` - Get all posts (optional: ?published=true)
- `GET /api/v1/posts/:id` - Get post by ID
- `GET /api/v1/posts/author/:authorId` - Get posts by author
- `POST /api/v1/posts` - Create new post
- `PATCH /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

## 🗄️ Database Management

### Prisma Studio
Open Prisma Studio to manage your database visually:
```bash
npm run prisma:studio
```

### Create a new migration
```bash
npx prisma migrate dev --name migration_name
```

### Reset database
```bash
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Code Quality

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## 🏗️ Building for Production

```bash
npm run build
```

The compiled files will be in the `dist/` directory.

## 🔧 Common Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## 📖 Learn More

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Swagger Documentation](https://swagger.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- NestJS Team
- Prisma Team
- Open Source Community
