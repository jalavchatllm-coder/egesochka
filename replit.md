# Refined Quill — EGE Essay Checker

## Overview
A Russian-language web application for automated EGE (Unified State Exam) essay checking using AI. Built with React, TypeScript, and Vite. Uses Supabase for authentication and backend functions, and Google Gemini AI (via Supabase Edge Functions) for essay evaluation.

## Project Architecture
- **Frontend**: React 18 + TypeScript, bundled with Vite
- **Styling**: Tailwind CSS (CDN) + custom CSS
- **Auth & Backend**: Supabase (auth, edge functions, database)
- **AI**: Google Gemini (invoked via Supabase Edge Functions)
- **Port**: Dev server runs on port 5000

## Project Structure
```
/
├── index.html          # Entry HTML
├── index.tsx           # React entry point
├── App.tsx             # Main app component
├── components/         # React components
├── services/           # Supabase client, Gemini service
├── types.ts            # TypeScript types
├── constants.ts        # App constants
├── styles.css          # Custom styles
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript config
└── schema.sql          # Database schema reference
```

## Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Recent Changes
- 2026-02-21: Configured for Replit environment (port 5000, allowed all hosts, removed ESM importmaps in favor of Vite bundling)
