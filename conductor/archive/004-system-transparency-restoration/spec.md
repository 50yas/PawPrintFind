# Specification: System Transparency Restoration

## Overview
Restore the `devModeMarquee` functionality to provide users with clear system status (development/test phase) across all supported languages.

## Goals
- Ensure the `devModeMarquee` is correctly localized in all 8 supported languages.
- Verify the marquee is visible and animating on the home page and throughout the app.
- Resolve any rendering issues causing the marquee to be hidden or truncated.

## Functional Requirements
- The marquee must display the string associated with the `devModeMarquee` translation key.
- The marquee must scroll infinitely from right to left.
- The marquee must be visible at the very top of the application.

## Technical Requirements
- Use `react-i18next` for translations.
- Implement CSS-based animation for the marquee.
- Ensure proper z-index management so the marquee isn't covered by other UI elements.
