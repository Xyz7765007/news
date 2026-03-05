# SignalScope — AI Signal Intelligence Engine

Track company news signals and automatically generate prioritized sales tasks with AI-powered classification.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js UI  │────▶│  /api/scan   │────▶│  OpenAI GPT-4o  │
│  (React)     │     │  News fetch  │     │  News generation │
└──────┬───────┘     └──────────────┘     └─────────────────┘
       │
       │             ┌──────────────────┐  ┌─────────────────┐
       └────────────▶│  /api/classify   │─▶│  OpenAI GPT-4o  │
                     │  • classify news │  │  • Classification│
                     │  • refine tasks  │  │  • Refinement    │
                     │  • get insights  │  │  • Insights      │
                     └──────────────────┘  └─────────────────┘
```

**APIs Used:**
- **OpenAI API** (GPT-4o-mini) — News generation, signal classification, task refinement, insights
- **NewsAPI** (optional) — Real news fetching when `NEWS_API_KEY` is set

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd signalscope
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
OPENAI_API_KEY=sk-your-new-key-here
NEWS_API_KEY=your-newsapi-key-here  # optional
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option A: One-Click Deploy

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Add environment variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `NEWS_API_KEY` = your NewsAPI key (optional)
5. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time — will set up project)
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add NEWS_API_KEY

# Deploy to production
vercel --prod
```

## Features

- **CSV Upload** — Import company lists with flexible column mapping
- **AI Scoring Configuration** — Chatbot or manual slider-based scoring setup
- **AI Task Definition** — Plain-language task builder with AI refinement
- **Real-time Scanning** — Background news scanning with pause/resume/stop
- **AI Classification** — GPT-4o classifies news against your task taxonomy
- **Deduplication** — Same company + same task = single entry
- **Task Detail Panel** — Click any task for AI-powered insights, suggested actions, and talking points
- **CSV Export** — Choose exactly which columns to export
- **Step Navigation** — Full back/forward navigation between all steps

## API Costs

The app uses `gpt-4o-mini` to keep costs low:
- **Scanning**: ~1 API call per company (news generation)
- **Classification**: ~1 API call per news item
- **Task Refinement**: ~1 API call per refinement request
- **Insights**: ~1 API call per task detail view

Estimated cost: ~$0.01-0.05 per company scanned.

## Security

⚠️ **Never commit API keys to your repository.** Always use environment variables.
- Use `.env.local` for local development
- Use Vercel Environment Variables for production
- The `.gitignore` already excludes `.env*` files
