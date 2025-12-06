# Synthetic Student Submission Generator

A web-based application that generates realistic synthetic student submissions using Gemini AI for testing and training purposes.

## Overview

This application allows educators and developers to:
- Generate synthetic student submissions for any assignment
- Customize grade distributions, writing levels, and variation parameters
- View, filter, sort, and search generated submissions
- Export data as CSV, JSON, or a ZIP file containing individual PDFs

## Architecture

### Frontend (React + Vite)
- **Location**: `/client`
- **Port**: 5000
- **Key Components**:
  - `ConfigForm`: Assignment configuration form
  - `SubmissionsTable`: Paginated table with sorting and filtering
  - `SubmissionModal`: Detailed view of individual submissions
  - `ExportButtons`: CSV, JSON, and ZIP export functionality

### Backend (Python Flask)
- **Location**: `/server`
- **Port**: 5001
- **Key Files**:
  - `app.py`: Flask API endpoints
  - `main.py`: Flask app and database initialization
  - `models.py`: SQLAlchemy database models
  - `generator.py`: Gemini AI-powered submission generation

### Database (PostgreSQL)
- Stores generation sessions and submissions
- Models: `GenerationSession`, `Submission`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate_submissions` - Generate synthetic submissions
- `GET /api/sessions` - List past generation sessions
- `GET /api/sessions/<id>` - Get specific session with submissions
- `POST /api/export/csv` - Export submissions as CSV
- `POST /api/export/json` - Export submissions as JSON
- `POST /api/export/zip` - Export as ZIP with PDFs

## Configuration Options

### Grade Distributions
- Normal: A(15%), B(30%), C(35%), D(15%), F(5%)
- Mostly Average: More C grades
- High Performing: More A/B grades
- Struggling: More D/F grades

### Writing Levels
- High School (9th-12th grade)
- Early Undergraduate (Freshman/Sophomore)
- Advanced Undergraduate (Junior/Senior)

### Variation Levels
- Low: Consistent style
- Medium: Moderate diversity
- High: Significant variation

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key (required for generation)
- `SESSION_SECRET`: Flask session secret key

## Recent Changes

- Initial implementation (December 2024)
