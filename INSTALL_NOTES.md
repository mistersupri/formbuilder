# Installation Notes

Aplikasi ini memerlukan beberapa package tambahan yang sudah ditambahkan ke `package.json`:

## Dependencies yang ditambahkan

```json
{
  "@dnd-kit/core": "^6.2.0",
  "@dnd-kit/sortable": "^8.0.0", 
  "@dnd-kit/utilities": "^3.2.2",
  "next-auth": "^5.0.0",
  "@auth/prisma-adapter": "^2.0.0",
  "googleapis": "^144.0.0",
  "@prisma/client": "^6.0.0",
  "prisma": "^6.0.0" (devDependency),
  "date-fns": "4.1.0" (already included in defaults)
}
```

## Langkah Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local dengan credentials Anda
   ```

3. **Setup database**
   ```bash
   npx prisma db push
   # atau
   npx prisma migrate deploy
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

## Prisma Setup

Schema sudah di-generate di `/prisma/schema.prisma`. Jika belum ada, jalankan:

```bash
npx prisma generate
npx prisma db push
```

## Google OAuth Setup

Lihat detailed instructions di SETUP.md

## Important Notes

- `dnd-kit` untuk drag-and-drop functionality di form builder
- `next-auth` dengan `@auth/prisma-adapter` untuk Google OAuth
- `googleapis` untuk Google Sheets & Drive API integration
- `date-fns` untuk date formatting di responses page
- `Prisma` untuk database ORM

## Troubleshooting Installation

### Module not found errors
Pastikan semua dependencies terinstall:
```bash
pnpm install
```

### Prisma client errors
Generate Prisma client:
```bash
npx prisma generate
```

### Database errors
Reset dan setup database baru:
```bash
npx prisma migrate reset
npx prisma db push
```

## Next Steps

1. Verify environment variables di `.env.local`
2. Run `pnpm dev` 
3. Akses `http://localhost:3000`
4. Login dengan Google OAuth
5. Buat form pertama Anda!
