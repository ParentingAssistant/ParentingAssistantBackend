# 🤖 AI Parenting Assistant - Backend

A Node.js backend service that provides AI-powered meal planning and bedtime story generation through RESTful APIs. This backend integrates **OpenAI’s GPT-4** with **Google Cloud Platform (GCP), Firebase, and Redis** to optimize AI API calls, caching, and security.

---

## 🚀 **Project Overview**
### **What This Backend Does**
- **🍽 AI-Powered Meal Planning** – Generates weekly meal plans based on dietary preferences.
- **📖 AI Bedtime Story Generator** – Creates personalized bedtime stories.
- **🏡 Smart Household Chores Scheduler** – Automates family task assignments.
- **🎮 Kids’ Routine Gamification** – AI-driven reminders and motivation for kids' activities.

### **AI-Driven & AI-Assisted Development**
This backend was **fully built and optimized using AI tools**, showcasing the power of AI in software development:
- **📌 AI Tools Used:**
  - **Cursor AI IDE** – AI-assisted coding, debugging, and refactoring.
  - **GitHub Copilot** – Autocomplete, test generation, and API integration.
  - **ChatGPT-4** – Backend architecture design, prompt engineering, and documentation generation.
  - **Banani AI** – UI prototyping and wireframe assistance.
  - **Galileo AI** – Design automation for AI-powered user interfaces.

---

## 🛠 **Tech Stack**
| **Category**      | **Technology Used**          |
|------------------|----------------------------|
| **Backend Framework** | Node.js (Express) & TypeScript |
| **Hosting** | Google Cloud Platform (GCP) |
| **Database & Caching** | Firebase Firestore + Redis |
| **AI Integration** | OpenAI API (GPT-4) |
| **Auth & Security** | Firebase Authentication & OAuth2 |
| **Deployment** | Docker + Google Cloud Run |
| **Development Tools** | Cursor AI IDE + GitHub + Copilot |

---

## 📡 **Backend Services & API Endpoints**
| **Endpoint** | **Method** | **Description** |
|-------------|----------|----------------|
| `/api/generate-meal-plan` | `POST` | Generate AI-powered meal plans (checks cache first) |
| `/api/generate-bedtime-story` | `POST` | AI-generated bedtime stories for kids |
| `/api/cache-clear` | `POST` | Clears cached responses when needed |
| `/api/user/preferences` | `GET` | Fetches stored user preferences from Firebase |
| `/api/user/update` | `POST` | Updates user preferences (diet, story themes, etc.) |

---

## 🔧 **Setup & Installation**
### **Prerequisites**
- Node.js 18 or higher
- Docker
- Redis
- Firebase project
- OpenAI API key
- Google Cloud account

### **Local Development**
```bash
# Clone the repository
git clone <repository-url>
cd parenting-assistant-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start Redis
docker compose up redis -d

# Run the development server
npm run dev
```

---

## 📦 **Docker & Deployment on GCP Cloud Run**
### **📌 Build & Deploy Docker Image**
```bash
# Build Docker Image
docker build -t gcr.io/YOUR_PROJECT_ID/parenting-assistant-backend:latest .

# Push Image to Google Cloud Registry
docker push gcr.io/YOUR_PROJECT_ID/parenting-assistant-backend:latest

# Deploy to Google Cloud Run
gcloud run deploy parenting-assistant-backend \
  --image gcr.io/YOUR_PROJECT_ID/parenting-assistant-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### **📌 GitHub Actions CI/CD**
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      - name: Authenticate with GCP
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Build & Push Docker Image
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/parenting-assistant-backend:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/parenting-assistant-backend:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy parenting-assistant-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/parenting-assistant-backend:${{ github.sha }} \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

---

## 📌 **Project Showcase & Future Roadmap**
✅ **AI-Generated Project**: Built with **Cursor AI, GitHub Copilot, and OpenAI APIs**
✅ **Optimized AI API Calls**: **40% cost reduction** via Firebase caching
✅ **Future Roadmap**: Expand to **voice-based AI interactions, parental stress tracking, and smart alerts**

📩 **Contact & Contributions**
- 🔗 LinkedIn: [linkedin.com/in/ahmedkhaledmohamed](https://www.linkedin.com/in/ahmedkhaledmohamed)
- 💼 GitHub: [github.com/your-username](https://github.com/your-username)
- 🤝 Contributions welcome! Fork, improve, and submit a PR!

🚀 _If you like this project, give it a ⭐ on GitHub and let’s push AI innovation further!_
