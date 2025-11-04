# Getting Started with DataBridge

Welcome to **DataBridge** - Integrove's visual data migration platform!

## 🎯 What is DataBridge?

DataBridge is an internal tool that simplifies SQL Server to PostgreSQL data migrations through:

- **Visual Mapping**: Drag-and-drop interface for schema mapping
- **Transformations**: Built-in and custom data transformations
- **Validation**: Pre and post-migration validation
- **Monitoring**: Real-time migration progress tracking

## ⚡ Quick Setup (5 minutes)

### 1. Prerequisites Check

```bash
node --version  # Should be v21+
yarn --version  # Should be 4.9.1+
psql --version  # Should be PostgreSQL 14+
```

### 2. Install & Run

```bash
# Clone and install
git clone <repository-url>
cd DataBridge
yarn

# Setup database
createdb databridge  # Or use Docker (see below)

# Configure environment
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/databridge"' > apps/web/.env.local

# Run migrations and start
yarn db:deploy
yarn dev
```

### 3. Open Application

Visit [http://localhost:3000](http://localhost:3000)

## 🐳 Using Docker for PostgreSQL

```bash
docker run --name databridge-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=databridge \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

## 📖 Next Steps

### For Developers

1. **Read the Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
2. **Review Code Standards**: [.cursorrules](./.cursorrules)
3. **Check Contributing Guide**: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)

### For Users

1. **Create a Connection**: Connect to your source SQL Server database
2. **Create a Mapping Project**: Start mapping your schemas
3. **Define Transformations**: Add data transformation rules
4. **Run Migration**: Execute and monitor your migration

## 🎨 Key Features

### Visual Schema Mapping

- Drag columns from source to target
- Automatic type compatibility checking
- One-to-many and many-to-one mappings

### Data Transformations

- **Built-in**: trim, uppercase, type conversion, date formatting
- **Custom**: Write JavaScript or SQL transformations
- **Preview**: Test transformations before migration

### Migration Execution

- **Staged Process**: Validation → Extraction → Transformation → Loading → Verification
- **Real-time Logs**: Monitor progress and errors
- **Retry Logic**: Automatic retry for failed batches

### Validation & Reports

- **Pre-migration**: Schema validation, compatibility checks
- **Post-migration**: Record counts, data integrity, reconciliation
- **Documentation**: Auto-generated migration reports

## 🛠️ Common Commands

```bash
# Development
yarn dev                    # Start development server
yarn build                 # Build for production

# Database
yarn db:studio             # Open database GUI
yarn db:seed               # Add sample data

# Code Quality
yarn lint                  # Check code quality
yarn typecheck            # Check TypeScript types
yarn test                 # Run tests
```

## 🏗️ Project Structure

```
DataBridge/
├── apps/web/              # Next.js application
│   ├── src/app/          # Routes and pages
│   ├── src/components/   # React components
│   ├── src/db/           # Database queries
│   └── src/lib/          # Actions and utilities
├── packages/schema/       # Database schema (READ-ONLY)
└── docs/                  # Documentation
```

## 🎓 Learning Path

### Week 1: Setup & Basics

- [ ] Complete setup
- [ ] Explore the UI
- [ ] Create a test connection
- [ ] Review architecture docs

### Week 2: Mapping & Transformations

- [ ] Create a simple mapping
- [ ] Add transformations
- [ ] Test data preview
- [ ] Review code patterns

### Week 3: Migration & Validation

- [ ] Run a test migration
- [ ] Review validation reports
- [ ] Understand error handling
- [ ] Explore monitoring features

## 🚨 Important Notes

### Read-Only Files

Never directly edit files in `packages/schema/`. These are managed through migrations.

### Integrove Brand Colors

- Primary (Cyan): #06B6D4
- Secondary (Teal): #32DBBC

Always use these colors for consistency.

### Code Standards

- Follow the three-layer architecture
- Use TypeScript strictly (no `any`)
- Write JSDoc for all functions
- Test all features

## 🆘 Need Help?

### Documentation

- [Setup Guide](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Error Handling](./docs/ERROR_HANDLING.md)

### Troubleshooting

- Check [docs/SETUP.md#troubleshooting](./docs/SETUP.md#troubleshooting)
- Review error logs in terminal
- Verify database connection
- Ensure all dependencies are installed

### Contact

Reach out to the Integrove development team for assistance.

---

**Ready to migrate data? Let's get started!** 🚀

_Internal Use Only - Integrove_
