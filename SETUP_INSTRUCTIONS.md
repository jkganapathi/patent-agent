# AI-Powered Patent Creation System - Multi-Agent Architecture

## 🚀 Quick Start

### 1. Environment Variables
Create a `.env.local` file in the root directory with at least one AI provider API key:

```bash
# Option 1: OpenAI / Vercel AI Gateway
OPENAI_API_KEY=your_openai_api_key_here
# OR
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key_here

# Option 2: Google Gemini (Recommended for cost-effectiveness)
GEMINI_API_KEY=your_gemini_api_key_here

# Option 3: Groq (Recommended for speed)
GROQ_API_KEY=your_groq_api_key_here
```

**Important**: You need at least one API key configured. The system will automatically use available providers with fallback.

### 2. Get API Keys

#### **Google Gemini API Key** (Recommended)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `.env.local` as `GEMINI_API_KEY`

#### **Groq API Key** (For Ultra-Fast Performance)
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add to `.env.local` as `GROQ_API_KEY`

#### **OpenAI / Vercel AI Gateway API Key** (Optional)
1. Visit [Vercel AI Gateway](https://ai-gateway.vercel.sh/) or [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Create a new API key
4. Copy the key and add to `.env.local` as `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY`

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
Open your browser and navigate to `http://localhost:3000`

## 🔧 Features

### Multi-Agent Patent Analysis System
- **🔍 Search Agent**: Automated prior art discovery and patent research
- **📊 Research Agent**: Novelty analysis and patentability assessment
- **⚖️ Claims Agent**: Professional patent claim drafting and optimization
- **📝 Document Agent**: Complete USPTO-compliant patent application generation
- **🎨 Diagram Agent**: Technical diagram suggestions and visual element planning
- **🔄 LangGraph Orchestration**: Seamless multi-agent workflow coordination

### Real-time Processing
- **Step-by-step Workflow**: Visual progress tracking through each analysis phase
- **Error Handling**: Comprehensive error reporting and recovery
- **Download Capabilities**: Export generated patent drafts as text files

### Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: CSS animations and transitions for better user experience
- **Real-time Feedback**: Live character counting and processing status

## 🏗️ Technical Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library

### Backend
- **LangGraph Multi-Agent System**: Orchestrated workflow with specialized agents
- **UnifiedAIProvider**: Multi-provider AI system with automatic fallback
- **Google Gemini**: Advanced AI models for patent analysis
- **Groq**: Ultra-fast inference for real-time processing
- **OpenAI**: GPT models via OpenAI API or Vercel AI Gateway
- **Next.js API Routes**: Serverless API endpoints

### Key Components
- `/lib/langgraph-config.js`: Multi-agent workflow configuration and orchestration
- `/app/api/patent/route.js`: Main API endpoint for patent processing
- `/app/page.js`: Main application interface with multi-agent results display
- `/app/globals.css`: Global styles and animations

## 📝 Usage

1. **Enter Invention Abstract**: Provide a detailed description of your invention
2. **Start Multi-Agent Workflow**: Click "Start Multi-Agent Workflow"
3. **Monitor Agent Progress**: Watch each specialized agent complete their tasks
4. **Review Comprehensive Results**: Examine prior art, novelty analysis, claims, diagrams, and patent draft
5. **Download Results**: Save patent draft, claims, and other generated content

## 🔒 Security

- API keys are stored securely in environment variables
- No sensitive data is logged or stored
- All API calls are made server-side for security

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure at least one AI provider API key is valid and properly configured
   - Check that your `.env.local` file exists and contains the correct keys
   - Verify API keys are active and have sufficient quota
2. **Provider Fallback**: The system automatically tries multiple providers if one fails
   - Check console logs to see which provider is being used
   - Ensure at least one provider is configured correctly
3. **CORS Issues**: All API calls are server-side, so CORS shouldn't be an issue
4. **Rate Limiting**: All providers have rate limits; the app includes error handling and automatic fallback

### Debug Mode
Check the browser console for detailed error messages and API response logs.

## 📄 License

This project is open source and available under the MIT License. 