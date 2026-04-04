# Form Builder Application - Setup Guide

Aplikasi Form Builder dengan integrasi Google yang lengkap. Pengguna dapat membuat form, menerima respons, dan mengintegrasikan dengan Google Sheets & Drive.

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Cloud credentials (OAuth 2.0)

## Environment Variables

Salin `.env.example` ke `.env.local` dan isi dengan nilai-nilai Anda:

```bash
cp .env.example .env.local
```

Variabel yang diperlukan:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_API_KEY` - Google API Key untuk Sheets & Drive
- `AUTH_SECRET` - Session secret (bisa di-generate dengan `openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` - URL aplikasi (untuk development: `http://localhost:3000`)

## Setup Database

```bash
# Install dependencies
pnpm install

# Run database migration
pnpm run setup-db

# Atau manual menggunakan Prisma
npx prisma migrate deploy
```

## Development

```bash
# Start development server
pnpm dev

# Akses aplikasi di http://localhost:3000
```

## Google OAuth Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru
3. Enable APIs:
   - Google Sheets API
   - Google Drive API
   - Google Identity Service

4. Buat OAuth 2.0 credentials:
   - Type: Web Application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

5. Copy Client ID dan Client Secret ke `.env.local`

## Features

### Form Builder
- Drag-and-drop field management
- Multiple field types: text, email, number, textarea, select, checkbox, radio, date, time, file, rating, phone
- Field validation dan conditional logic support
- Real-time preview

### Form Publishing
- Publish forms sebagai standalone pages
- Generate embed code untuk widget
- Domain whitelist untuk security
- QR code generation
- Direct sharing links

### Google Integration
- Auto-sync responses ke Google Sheets
- Save backups ke Google Drive
- OAuth-based authentication

### Response Management
- View all form responses
- Export responses as CSV
- Response analytics
- Real-time response tracking

### User Features
- Google OAuth login
- Multiple forms per user
- Form statistics dashboard
- Response export tools

## Architecture

### Frontend
- Next.js 15 (App Router)
- React 19
- TailwindCSS v4
- shadcn/ui components
- dnd-kit untuk drag-and-drop

### Backend
- Next.js API routes
- Prisma ORM
- PostgreSQL
- Auth.js untuk authentication
- Google APIs (Sheets, Drive)

### Database
- Users (auth)
- Forms (form definitions)
- Responses (form submissions)
- Domain whitelists

## API Routes

### Forms
- `GET /api/forms` - List user's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/[id]` - Get form details
- `PUT /api/forms/[id]` - Update form
- `DELETE /api/forms/[id]` - Delete form

### Responses
- `GET /api/forms/[id]/responses` - Get form responses
- `POST /api/forms/[id]/responses` - Submit form response

### Google Integration
- `POST /api/forms/[id]/google-integration` - Setup Google integration
- `PUT /api/forms/[id]/google-integration` - Sync responses to Sheets

### Widget
- `GET /api/widgets/embed` - Get embed code with CORS validation

## Pages

### User Pages
- `/` - Home (redirect to dashboard atau login)
- `/login` - Google OAuth login
- `/dashboard` - Forms list dan management
- `/editor/[id]` - Form builder editor
- `/editor/[id]/preview` - Form preview
- `/editor/[id]/publish` - Publish settings
- `/editor/[id]/responses` - Response dashboard
- `/editor/[id]/settings` - Form settings

### Public Pages
- `/form/[slug]` - Published form
- `/form/[slug]/success` - Submission success page

## Deployment

### Vercel (Recommended)
1. Push code ke GitHub
2. Connect repo di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

### Other Platforms
Pastikan environment variables sudah dikonfigurasi dan database migration sudah berjalan:

```bash
npx prisma migrate deploy
npm run build
npm start
```

## Security Considerations

1. **CORS** - Widget embedding menggunakan domain whitelist
2. **Authentication** - OAuth via Google, session stored in database
3. **Input Validation** - Zod schema validation untuk semua inputs
4. **HTTPS** - Always use HTTPS di production
5. **Rate Limiting** - Implementasi di future versions

## Troubleshooting

### Database connection error
- Verify `DATABASE_URL` format
- Ensure database server is running
- Check network connectivity

### Google OAuth error
- Verify credentials di `.env.local`
- Check redirect URIs di Google Console
- Ensure APIs are enabled

### Form submission fails
- Check form is published
- Verify domain whitelist (untuk embedded forms)
- Check response validation errors

## Future Enhancements

- [ ] QR code generation
- [ ] Advanced conditional logic
- [ ] Custom themes/branding
- [ ] Form templates
- [ ] AI-powered form suggestions
- [ ] Advanced analytics
- [ ] Zapier integration
- [ ] Email notifications
- [ ] Payment collection
- [ ] Rate limiting dan pricing tiers

## Support

Untuk bantuan lebih lanjut:
1. Check dokumentasi di repository
2. Review error messages di server logs
3. Contact support atau create issue di GitHub
