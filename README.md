# My Agents Platform

[![License: MIT-NC](https://img.shields.io/badge/License-MIT--NC-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

A modern, multi-tenant AI assistant platform with ChatGPT-like interface, custom agent creation, and MCP (Model Context Protocol) integration. Built for internal tools and non-commercial use.

## Prototype

Watch our platform in action:

![Prototype Demo](media/prototype.mp4)



## 🚀 Features

### 🤖 AI Agent Management
- **Custom Agent Creation**: Build specialized AI assistants for your specific needs
- **Agent Templates**: Pre-built templates for common use cases
- **MCP Integration**: Model Context Protocol for enhanced tool capabilities
- **Agent Analytics**: Track usage and performance metrics

### 💬 Advanced Chat System
- **Real-time Messaging**: WebSocket-based chat with instant responses
- **Markdown Support**: Rich text formatting with code highlighting
- **File Upload**: Support for various file types in conversations
- **Conversation History**: Persistent chat history with search

### 🏢 Multi-Tenant Architecture
- **Tenant Isolation**: Complete data separation per organization
- **Custom Branding**: Tenant-specific logos and styling
- **Role-Based Access**: User, admin, and owner permissions
- **Tenant Analytics**: Isolated usage metrics per tenant

### 📚 Knowledge Base
- **Document Upload**: PDF, Word, Excel, and text files
- **Vector Search**: Semantic search with embeddings
- **Web Content**: Import from websites and RSS feeds
- **Database Integration**: Connect external data sources

### 📁 File Storage
- **S3-Compatible**: MinIO integration for scalable storage
- **Multi-Tenant**: Tenant-specific file isolation
- **Version Control**: Automatic file versioning
- **Access Control**: Granular file permissions

### 📊 Analytics & Monitoring
- **Usage Analytics**: Track user activity and engagement
- **Performance Metrics**: Monitor response times and errors
- **Cost Tracking**: API usage and billing analytics
- **Real-time Monitoring**: Live system health monitoring

## 🛠️ Technology Stack

### Frontend
- **Next.js 14+**: React framework with App Router
- **React 18+**: UI library with hooks and concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management

### Backend (Planned)
- **FastAPI**: High-performance Python web framework
- **PostgreSQL**: Primary database with multi-tenancy
- **Redis**: Caching and session management
- **Celery**: Background task processing
- **Docker**: Containerized deployment

### AI & ML
- **OpenAI GPT Models**: Primary AI language models
- **Vector Database**: Pinecone/Weaviate for embeddings
- **MCP Integration**: Model Context Protocol for tools
- **Custom Embeddings**: Domain-specific model fine-tuning

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/my-agents.git
cd my-agents

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 🏗️ Project Structure

```
my-agents/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # App Router pages and layouts
│   │   │   ├── [locale]/       # Internationalized routes
│   │   │   │   ├── (authenticated)/  # Protected routes
│   │   │   │   │   ├── agents/      # Agent management
│   │   │   │   │   ├── analytics/   # Analytics dashboard
│   │   │   │   │   ├── chat/        # Chat interface
│   │   │   │   │   ├── dashboard/   # Main dashboard
│   │   │   │   │   ├── files/       # File management
│   │   │   │   │   ├── knowledge/   # Knowledge base
│   │   │   │   │   ├── settings/    # User settings
│   │   │   │   │   └── users/       # User management
│   │   │   │   ├── login/           # Authentication
│   │   │   │   └── test/            # Test pages
│   │   │   └── globals.css         # Global styles
│   │   ├── assets/             # Static assets (fonts, icons, images)
│   │   ├── components/         # React components
│   │   │   ├── common/         # Reusable UI components
│   │   │   ├── features/       # Feature-specific components
│   │   │   └── layout/         # Layout components
│   │   ├── constants/          # Application constants
│   │   ├── hooks/              # Custom React hooks
│   │   ├── i18n/               # Internationalization
│   │   ├── pages/              # Page components
│   │   ├── providers/          # React context providers
│   │   ├── services/           # API services and integrations
│   │   ├── styles/             # Styling and themes
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── public/                 # Static public assets
│   ├── config/                 # Configuration files
│   ├── messages/               # i18n message files
│   └── scripts/                # Build and deployment scripts
├── backend/                     # Backend services (planned)
├── documents/                   # Project documentation
│   ├── requirements/           # Functional and technical requirements
│   ├── technical-solution/     # Architecture and technical specs
│   ├── development/            # Development guides and user stories
│   ├── rules/                  # Coding standards and conventions
│   └── vibe-coding-logs/       # Development logs and progress
├── deployments/                 # Deployment configurations
├── media/                       # Media files (demos, screenshots)
├── CONTRIBUTING.md             # Contribution guidelines
└── LICENSE                     # License file
```

## 🎯 Use Cases

### Internal Tools
- **Customer Support**: AI-powered customer service agents
- **Documentation**: Intelligent documentation assistants
- **Code Review**: Automated code analysis and suggestions
- **Data Analysis**: AI-driven insights and reporting
- **Employee Training**: AI-assisted learning and development
- **Process Automation**: Streamlined internal workflows

### Educational Institutions
- **Student Support**: 24/7 student assistance
- **Research**: AI-powered research assistants
- **Administration**: Automated administrative tasks
- **Learning**: Personalized learning experiences

### Business Organizations
- **Internal Operations**: Streamlined business processes
- **Knowledge Management**: Centralized information access
- **Team Collaboration**: Enhanced communication tools
- **Decision Support**: AI-powered insights for business decisions

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines before submitting pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write comprehensive tests
- Document complex logic

## 📄 License

This project is licensed under the **MIT License with Non-Commercial Use Restriction**. See the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ **Allowed**: Personal use, educational institutions, any organization for internal tools, self-hosted internal deployments
- ❌ **Prohibited**: Commercial use, selling the software, SaaS applications, hosting for third parties
- 📧 **Commercial Licensing**: Contact us for commercial licensing options

### What This Means
- You can use this software for personal projects and learning
- Educational institutions can use it for teaching and research
- Any organization (for-profit or non-profit) can use it for internal tools
- You can self-host the software for internal use only
- You cannot build SaaS applications or host it for third parties
- Commercial use requires a separate license agreement

## 🆘 Support

### Documentation
- [Frontend Documentation](frontend/README.md)
- [Development Guides](documents/development/)
- [Technical Specifications](documents/technical-solution/)

### Getting Help
- 📧 **Email**: minhduongkhtn@gmail.com
- 💬 **Issues**: [GitHub Issues](https://github.com/yourusername/my-agents/issues)
- 📖 **Discussions**: [GitHub Discussions](https://github.com/yourusername/my-agents/discussions)

### Commercial Inquiries
For commercial licensing and enterprise support, please contact us at minhduongkhtn@gmail.com

### 💝 Support Our Work
If you find this project useful, consider supporting its development:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/duongmngo)
[![Donate via PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/duongngo1)
[![Sponsor on GitHub](https://img.shields.io/badge/GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/duongmngo)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- AI powered by [OpenAI](https://openai.com/)
- Icons by [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This software is designed for internal tools and self-hosted deployments. Building SaaS applications or hosting for third parties is prohibited. For commercial applications, please contact us for licensing options.

Made with ❤️ for the open-source community 