# Narelle's Keeper

A quiet companion PWA for Narelle — living well day to day. Ara speaks softly.

## Step 2 (this release)

- Sage accent (replaces gold)
- Medicines room: add / edit / remove meds (name, dose, time(s)), tick taken for today, persisted in `localStorage`
- Alarms scaffolding: Notification permission + help copy; schedule browser notifications for upcoming doses while the tab/app is open (Service Worker `showNotification` best-effort)
- Today shows next-due in sky blue with warm Ara copy
- Soft placeholder for Buddha statue + greenery (photo later)

**Not yet:** full iOS background push (needs Web Push + backend — noted as TODO), appointments, Rosie photo.

## Local

```bash
npx serve .
```

## Deploy

Static site on Vercel project `my-keeper-home`, live alias `https://narelles-keeper.vercel.app/`.
