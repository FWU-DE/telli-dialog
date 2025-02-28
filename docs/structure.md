# Project Directory Structure

This document provides an overview of the top-level directories in the project with brief explanations of their purpose and contents.

## [`/app`](/app)

The main application directory, containing Next.js app router structure with both authenticated and unauthenticated routes. Houses the primary UI layouts, error handling components, and global styling for the application.

Key components:

- Authentication-based routing (`(authed)` and `(unauth)`)
- API endpoints
- Root layout and error handling

## [`/auth`](/auth)

Authentication system implementation including providers integration, utility functions, and type definitions.

Key components:

- Authentication providers (likely OAuth integrations)
- Authentication-related utility functions
- Type definitions for the auth system

## [`/components`](/components)

Reusable UI components organized by functionality, including authentication components, chat interface elements, and navigation.

Key components:

- Common shared components
- Chat and conversation UI elements
- Navigation components
- Custom icons and hooks

## [`/db`](/db)

Database configuration, schema definitions, and utility functions for database interactions. Includes Drizzle ORM configuration and migration management.

Key components:

- Schema definitions
- Database migrations
- Cryptography utilities for data security
- Database seeding logic

## [`/env`](/env)

Environment configuration management and validation of required environment variables.

## [`/i18n`](/i18n)

Internationalization and localization support, enabling multi-language functionality throughout the application.

## [`/icons`](/icons)

SVG icon library organized by category for use throughout the application, separated from the components directory for better organization.

Key categories:

- UI action icons
- Character representations
- Feature-specific icon sets

## [`/knotenpunkt`](/knotenpunkt)

Containing utils for callen the telli-api based on the open-source [knotenpunkt](https://github.com/deutschlandgpt/knotenpunkt)

## [`/s3`](/s3)

Contains util function for accessing s3 compatible stores (like IONOS or OTC)

## [`/utils`](/utils)

General utility functions and helpers organized by functionality, providing common operations used throughout the application.

Key utilities:

- Array and object manipulation
- Date handling and formatting
- File management utilities
- Error handling
- Navigation helpers
- Random generation functions
