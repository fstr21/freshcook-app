# FreshCook - Git Repository Setup Guide

## 📥 Getting Your Code from Bolt to Git

### Method 1: Download Project Files

1. **Download the project** from Bolt:
   - Look for a "Download" or "Export" button in the Bolt interface
   - This will give you a ZIP file with all your code

2. **Extract and prepare**:
   ```bash
   # Extract the downloaded ZIP file
   unzip freshcook-app.zip
   cd freshcook-app
   
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit: FreshCook recipe app"
   ```

3. **Create GitHub repository**:
   - Go to GitHub.com
   - Click "New repository"
   - Name it "freshcook-app"
   - Don't initialize with README (we already have one)

4. **Connect and push**:
   ```bash
   git remote add origin https://github.com/yourusername/freshcook-app.git
   git branch -M main
   git push -u origin main
   ```

### Method 2: Manual File Copy

If download isn't available, you can manually copy the files:

1. **Create local project**:
   ```bash
   mkdir freshcook-app
   cd freshcook-app
   git init
   ```

2. **Copy files from Bolt**:
   - Copy each file from the Bolt interface
   - Create the same directory structure
   - Paste the content into corresponding files

3. **Essential files to copy**:
   ```
   package.json
   src/
   ├── App.tsx
   ├── main.tsx
   ├── index.css
   ├── components/
   ├── services/
   ├── hooks/
   ├── utils/
   ├── types/
   └── lib/
   supabase/
   ├── functions/
   └── migrations/
   public/
   index.html
   tailwind.config.js
   tsconfig.json
   vite.config.ts
   README.md
   LICENSE
   .gitignore
   ```

### Method 3: Use Bolt's Git Integration (if available)

Some versions of Bolt may have direct Git integration:

1. Look for "Connect to Git" or "Push to GitHub" options
2. Follow the prompts to connect your GitHub account
3. Create or select a repository
4. Push directly from Bolt

## 🔧 After Getting the Code

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure Supabase
- Set up your Supabase project
- Run database migrations
- Configure Edge Functions with API keys

### 4. Test Locally
```bash
npm run dev
```

## 📋 What Your Developer Will Get

Your repository will include:

✅ **Complete React/TypeScript application**
✅ **All components and services**
✅ **Database schema and migrations**
✅ **Edge Functions for AI integration**
✅ **Security implementations**
✅ **Comprehensive documentation**
✅ **Development and production configs**
✅ **API testing tools**

## 🚀 Next Steps for Collaboration

1. **Share repository URL** with your developer
2. **Provide API keys** securely (not in the repo)
3. **Review the README.md** for setup instructions
4. **Check SECURITY_SETUP.md** for production deployment

## 📞 Need Help?

If you encounter issues:
- Check the README.md for detailed setup instructions
- Use the built-in API testing tools in development mode
- Review the project structure in the documentation

Your FreshCook app is production-ready and includes everything needed for professional development!