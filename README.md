# FreshCook - AI-Powered Recipe Discovery App

Turn your ingredients into amazing recipes with AI-powered suggestions and reduce food waste.

## 🌟 Features

- **AI Recipe Generation**: Get personalized recipes based on your available ingredients
- **Image Analysis**: Upload photos to automatically detect ingredients using Google Vision API
- **Favorite Recipes**: Save and organize your favorite recipes
- **Ingredient History**: Quick access to previously used ingredients
- **Responsive Design**: Beautiful, mobile-friendly interface
- **Secure Authentication**: User accounts with secure login/signup
- **Real-time Updates**: Instant recipe generation and favorites management

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Edge Functions)
- **AI Services**: 
  - OpenRouter API (Recipe generation with Claude 3.5 Sonnet)
  - Google Cloud Vision API (Image analysis)
- **Deployment**: Netlify
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenRouter API key
- Google Cloud Vision API key (optional, for image analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd freshcook-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project
   - Run the database migrations (see Database Setup section)
   - Configure authentication settings
   - Set up Edge Functions environment variables

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

The app uses two main tables:

### `favorite_recipes`
Stores user's saved recipes with full recipe data including ingredients, instructions, cooking time, etc.

### `ingredient_history` 
Tracks ingredients users have searched with for quick re-use.

Both tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## 🔧 Configuration

### Supabase Edge Functions

The app uses several Edge Functions that need to be configured:

1. **`analyze-image`** - Processes uploaded images to detect ingredients
   - Requires: `GOOGLE_CLOUD_VISION` environment variable

2. **`generate-recipes`** - Creates AI-powered recipe suggestions
   - Requires: `OPEN_ROUTER_API_KEY` environment variable

3. **`test-vision-api`** - Tests Google Vision API connection (development only)

4. **`test-openrouter-key`** - Tests OpenRouter API key format (development only)

### Environment Variables (Supabase Edge Functions)

Set these in your Supabase project settings under Edge Functions:

```env
GOOGLE_CLOUD_VISION=your_google_vision_api_key
OPEN_ROUTER_API_KEY=your_openrouter_api_key
```

## 🔐 Security Features

- **Input Validation**: All user inputs are sanitized and validated
- **Rate Limiting**: Client-side rate limiting for API calls
- **Row Level Security**: Database-level security policies
- **Secure Authentication**: Supabase Auth with strong password requirements
- **CORS Protection**: Proper CORS headers on all API endpoints
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 📱 Usage

1. **Sign up/Sign in** to create an account
2. **Add ingredients** manually or by uploading a photo
3. **Generate recipes** based on your ingredients
4. **Save favorites** by clicking the heart icon
5. **View your saved recipes** in the favorites section
6. **Reuse ingredients** from your search history

## 🚀 Deployment

### Netlify Deployment

1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Environment Variables (Netlify)

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Development

### API Testing

The app includes development-only API testing components:

- Access via the "API Test" button in development mode
- Test both Google Vision and OpenRouter API connections
- Detailed error reporting and key validation

### Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── IngredientInput.tsx # Ingredient input with image upload
│   ├── RecipeCard.tsx  # Recipe display component
│   └── ...
├── hooks/              # Custom React hooks
├── services/           # API service classes
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── lib/                # Third-party library configurations

supabase/
├── functions/          # Edge Functions
│   ├── analyze-image/  # Image analysis function
│   ├── generate-recipes/ # Recipe generation function
│   └── ...
└── migrations/         # Database migrations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for AI model access
- **Google Cloud Vision** for image analysis
- **Supabase** for backend infrastructure
- **Tailwind CSS** for styling
- **Lucide** for beautiful icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Review the security setup guide in `SECURITY_SETUP.md`
3. Test your API connections using the built-in testing tools

---

**Made with ❤️ for sustainable cooking and reducing food waste**