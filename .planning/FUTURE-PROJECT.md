# Future Project: AI SaaS Platform

## Overview

This document outlines phases and features deferred to a future project after the MVP launch. The MVP (Phases 1-4) focuses on delivering core business value: CRM integration and lead scraping.

**Decision Date:** 2026-04-21
**Reason:** Focus on getting CRM and lead scraper live and tested in production before expanding scope.

## Deferred Phases

### Phase 5: AI Quotes Module
**Goal:** Tenants can generate instant quotes from lead information using AI pricing models

**Key Features:**
- AI-powered quote generation from lead data
- Pricing model calibrated for Canberra ACT suburbs
- Quote sync to Twenty as Quote custom object
- Admin UI for reviewing and editing AI-generated quotes
- Line items, terms, and expiry dates

**Requirements:** QUOTES-01 through QUOTES-05

### Phase 6: AI SEO & Content Modules
**Goal:** Tenants can optimize their online presence and generate social media content with AI

**Key Features:**
- SEO analysis of business listings with AI recommendations
- SEO score tracking over time
- Social media post generation (Facebook/Instagram)
- Content calendar UI for scheduling posts
- Content reuse and usage credit tracking

**Requirements:** SEO-01 through SEO-04, CONTENT-01 through CONTENT-05

### Phase 7: Competitor Analysis Module
**Goal:** Tenants can monitor competitor pricing and online presence with AI-generated insights

**Key Features:**
- Competitor website and listing scraping
- AI-generated comparison insights and recommendations
- Analysis results stored in database
- Multiple competitors per tenant with change tracking

**Requirements:** COMP-01 through COMP-04

### Phase 8: Billing & Module Management
**Goal:** Tenants can manage subscriptions and modules via Stripe integration with self-service billing

**Key Features:**
- 14-day free trial without credit card
- Mid-cycle module add/remove with proration
- Stripe webhooks for subscription state sync
- requireModule() middleware for runtime enforcement
- Billing dashboard with Stripe Customer Portal link
- Module catalog with pricing

**Requirements:** BILL-01 through BILL-12, MMGT-01 through MMGT-06

## Prerequisites for Future Project

Before starting these phases, ensure:

1. MVP is live in production
2. CRM integration is stable and tested
3. Lead scraper is running reliably
4. User feedback collected and prioritized
5. Infrastructure capacity assessed (AI API costs, etc.)

## Notes for Future Planning

- The platform's modular architecture makes adding these features straightforward
- Twenty CRM will be the central data hub for all modules
- Consider metered pricing for AI features (quotes, content, SEO)
- Stripe integration will require separate security review
