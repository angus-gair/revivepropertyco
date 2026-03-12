<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Revive Property Co. - Premium Property Services

A modern website for Revive Property Co. featuring AI-powered chat concierge "Riv" for instant property service quotes and inquiries.

**Live URL:** https://revivepropertyco.ajinsights.com.au

## Features

- **Service Showcase**: Pressure washing, epoxy grouting, estate management, pool hydraulics
- **AI Chat Concierge**: "Riv" provides instant quotes and answers service questions
- **Booking System**: Integrated booking and contact forms
- **Admin Portal**: Manage bookings and customer inquiries
- **Powered by Gemini**: Uses `gemini-3-flash-preview` for natural language interactions

## AI Configuration

This app uses the self-hosted Gemini API at `https://gemini.ajinsights.com.au/v1` with OpenAI-compatible endpoints.

**Model**: `gemini-3-flash-preview` (latest Gemini Flash model)
**API**: OpenAI-compatible format
**Endpoint**: `https://gemini.ajinsights.com.au/v1/chat/completions`
**Configuration**: Hardcoded in `services/geminiService.ts`

The AI concierge "Riv" is specialized for providing property service quotes and recommendations based on user inquiries.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Deployment

The app is containerized and deployed via Docker Compose with Traefik reverse proxy for HTTPS.
