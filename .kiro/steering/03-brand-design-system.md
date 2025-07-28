---
inclusion: always
---

# 🎨 BRAND THEME & DESIGN SYSTEM

## 🚨 CRITICAL: When Creating ANY New Pages or Components

**ALWAYS reference `/Docs/PRD_RevivaTech_Brand_Theme.md` BEFORE creating any new pages or components.**

This document contains:
- **Complete color psychology** and trust-building principles
- **Brand color palette** with exact hex codes and usage guidelines
- **Component specifications** for trust-building elements
- **Typography guidelines** and design tokens
- **Trust signal components** and implementation patterns

## Primary Brand Colors (MUST USE)
```scss
// Trust Blue Palette (Primary - builds customer confidence)
--trust-500: #ADD8E6  // Main brand color for primary CTAs
--trust-700: #4A9FCC  // Text and accents
--trust-900: #1A5266  // Dark text and headers

// Professional Teal Palette (Secondary - expertise/innovation)
--professional-500: #008080  // Secondary CTAs and process steps
--professional-700: #0F766E  // Professional accents
--professional-900: #134E4A  // Supporting elements

// Neutral Reliability Grey (Foundation)
--neutral-700: #36454F  // Body text and reliable elements
--neutral-600: #4B5563  // Secondary text
--neutral-300: #D1D5DB  // Borders and subtle elements
```

## Trust-Building Design Principles
1. **Immediate Trust Signals**: Always include trust elements above the fold
2. **Transparent Pricing**: Show clear, honest pricing without hidden fees
3. **Human Connection**: Use authentic customer photos and technician profiles
4. **Process Transparency**: Clearly explain repair process and timelines
5. **Risk Reversal**: Prominent guarantees, warranties, and "no fix, no fee" badges

## Required Components for New Pages
- **TrustSignal**: Customer metrics, certifications, satisfaction rates
- **TestimonialCard**: Authentic customer reviews with photos
- **PricingDisplay**: Transparent pricing with trust elements
- **ProcessStep**: Clear repair process explanation
- **CertificationBadge**: Professional credentials and verifications

## Color Usage Guidelines
- **Primary CTAs**: Use Trust Blue (#ADD8E6) for "Book Repair", "Get Quote"
- **Secondary Actions**: Use Professional Teal (#008080) for "Learn More", process steps
- **Body Text**: Use Neutral Grey (#36454F) for readability and trust
- **Trust Elements**: Combine Trust Blue and Professional Teal for credibility signals

## Page Creation Checklist
- [ ] Referenced PRD_RevivaTech_Brand_Theme.md for design guidance
- [ ] Used correct brand color palette (Trust Blue, Professional Teal, Neutral Grey)
- [ ] Included at least 2-3 trust-building elements above the fold
- [ ] Applied transparent pricing principles if applicable
- [ ] Used authentic imagery and avoided generic stock photos
- [ ] Implemented proper typography hierarchy (SF Pro Display/Text)
- [ ] Ensured WCAG AA accessibility compliance
- [ ] Added appropriate trust signals and certifications

## ❌ NEVER DO
- Use colors outside the brand palette without explicit approval
- Create pages without trust-building elements
- Use generic stock photography instead of authentic images