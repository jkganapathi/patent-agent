# AI-Powered Patent Creation System - Multi-Agent Architecture

## 🚀 Quick Start

### 1. Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```bash
# Vercel AI Gateway API Key (Required)
# Get your API key from: https://vercel.com/docs/ai-gateway
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key_here
```

**Important**: The API key should be a complete Vercel AI Gateway key, not a regular OpenAI key. Make sure there are no extra characters or encoding issues.

### 2. Get Vercel AI Gateway API Key
1. Visit [Vercel AI Gateway](https://ai-gateway.vercel.sh/)
2. Sign up or log in to your Vercel account
3. Navigate to the AI Gateway dashboard
4. Create a new API key
5. Copy the key and add it to your `.env.local` file as `AI_GATEWAY_API_KEY`

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
- **Claude Sonnet 4**: Advanced AI model for patent analysis via Vercel AI Gateway
- **Next.js API Routes**: Serverless API endpoints
- **Vercel AI Gateway**: Scalable AI infrastructure

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

1. **API Key Error**: Ensure your Vercel AI Gateway API key is valid and properly configured
2. **CORS Issues**: All API calls are server-side, so CORS shouldn't be an issue
3. **Rate Limiting**: Vercel AI Gateway has rate limits; the app includes error handling for this

### Debug Mode
Check the browser console for detailed error messages and API response logs.

## 📄 License

This project is open source and available under the MIT License. 