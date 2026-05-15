# AEO + GEO Analyser

Analyse any website for Answer Engine Optimisation (AEO) and Generative Engine Optimisation (GEO), with competitor benchmarking and actionable quick wins. Powered by Claude with web search.

## Local development

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (recommended)

1. Push to GitHub
2. Import at vercel.com
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

## Deploy to Railway / Render

- Build: `npm run build`
- Start: `npm run start`
- Add env var: `ANTHROPIC_API_KEY`

## Get an API key

Sign up at console.anthropic.com and create an API key.
