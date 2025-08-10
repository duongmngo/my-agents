# Quick Installation Guide

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

## Step 2: Start Development Server

```bash
npm run dev
```

## Step 3: Open Browser

Navigate to: `http://localhost:3000`

## Step 4: Login with Demo Accounts

### Admin Account
- Email: `admin@demo.com`
- Password: `admin123`

### User Account  
- Email: `user@demo.com`
- Password: `user123`

## 🎉 You're Ready!

The prototype is now running with:
- ✅ Mock authentication
- ✅ Dashboard with statistics
- ✅ Sample agents and conversations
- ✅ Responsive UI
- ✅ Navigation and user menu

## Troubleshooting

If you encounter any issues:

1. **Node version**: Make sure you have Node.js 18+ installed
2. **Port conflicts**: If port 3000 is busy, the dev server will automatically use the next available port
3. **Dependencies**: If installation fails, try `npm cache clean --force` then `npm install`

## Next Steps

After exploring the prototype, you can:
1. Review the code structure in `src/`
2. Modify components to see changes in real-time
3. Add new features following the established patterns
4. Connect to a real backend API when ready 