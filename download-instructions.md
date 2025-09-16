# AI-Powered Video Proctoring System

## Download Instructions

Your complete project has been packaged and is ready for download. The archive contains all source code, configuration files, and database migrations.

## What's Included

- **Frontend Code**: React components with TypeScript
- **AI Detection**: TensorFlow.js and MediaPipe integration
- **Database Schema**: Supabase migration files
- **Configuration**: Tailwind CSS, Vite setup, and environment templates
- **Documentation**: This file and setup instructions

## Setup Instructions

1. **Extract the archive** to your desired location
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new Supabase project at https://supabase.com
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key to `.env`
   - Run the database migrations in the `supabase/migrations/` folder

4. **Start development server**:
   ```bash
   npm run dev
   ```

## Key Features

- ✅ Real-time face detection and gaze tracking
- ✅ Object detection for unauthorized items
- ✅ Focus loss monitoring (5-second threshold)
- ✅ Multiple face detection
- ✅ Comprehensive event logging
- ✅ Automated integrity scoring
- ✅ Professional reporting dashboard
- ✅ Video recording capabilities
- ✅ Responsive design

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **AI/ML**: TensorFlow.js + MediaPipe + COCO-SSD
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom hooks for AI analysis
├── lib/                # Supabase client
├── types/              # TypeScript definitions
└── App.tsx             # Main application

supabase/
└── migrations/         # Database schema files
```

## Support

This is a production-ready proctoring system with advanced AI capabilities. All code is well-documented and follows modern React/TypeScript best practices.

For questions about the implementation, refer to the inline comments in the source code.