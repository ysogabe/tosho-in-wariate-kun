# Deployment Guide

This directory contains comprehensive deployment documentation for the Tosho-in Wariate-kun project.

## Deployment Overview

The Tosho-in Wariate-kun system supports multiple deployment strategies, from local development to production cloud deployments. The system is designed as a monorepo with separate frontend and backend applications that can be deployed independently or together.

## Documentation Structure

### Deployment Strategies
- **[Production Deployment](./production/README.md)** - Complete production deployment guide
- **[Staging Deployment](./staging/README.md)** - Staging environment setup
- **[Development Deployment](./development/README.md)** - Local and development environment setup
- **[Docker Deployment](./docker/README.md)** - Containerized deployment options

### Platform-Specific Guides
- **[Vercel Deployment](./platforms/vercel.md)** - Frontend deployment on Vercel
- **[Railway Deployment](./platforms/railway.md)** - Full-stack deployment on Railway
- **[DigitalOcean Deployment](./platforms/digitalocean.md)** - VPS deployment guide
- **[AWS Deployment](./platforms/aws.md)** - AWS cloud deployment
- **[Google Cloud Deployment](./platforms/gcp.md)** - Google Cloud Platform deployment

### Infrastructure & DevOps
- **[CI/CD Pipeline](./cicd/README.md)** - Continuous integration and deployment
- **[Environment Configuration](./environment/README.md)** - Environment variables and configuration
- **[Database Setup](./database/README.md)** - Database deployment and migration
- **[Monitoring & Logging](./monitoring/README.md)** - Production monitoring setup

### Security & Maintenance
- **[Security Configuration](./security/README.md)** - Production security setup
- **[SSL/TLS Setup](./security/ssl-setup.md)** - HTTPS configuration
- **[Backup & Recovery](./backup/README.md)** - Data backup and disaster recovery
- **[Maintenance](./maintenance/README.md)** - Ongoing maintenance procedures

## Quick Deployment Options

### 1. Local Development
```bash
# Clone and setup
git clone https://github.com/your-org/tosho-in-wariate-kun.git
cd tosho-in-wariate-kun
pnpm install

# Start development servers
pnpm dev
```

### 2. Docker Compose (Recommended for Testing)
```bash
# Build and start all services
docker-compose up -d

# Services available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Database: localhost:5432
```

### 3. Vercel (Frontend Only)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd apps/frontend
vercel --prod
```

### 4. Railway (Full Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

## Architecture Overview

### Application Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │────│     Backend     │────│    Database     │
│   (Next.js)     │    │    (NestJS)     │    │  (PostgreSQL)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│     Vercel      │    │    Railway      │    │    Railway      │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Shared Packages
The monorepo includes shared packages that are built and included in both frontend and backend deployments:
- `@tosho/shared` - Common types and interfaces
- `@tosho/ui` - Shared UI components (frontend only)
- `@tosho/utils` - Common utilities

## Environment Requirements

### System Requirements
- **Node.js**: 20.x LTS
- **pnpm**: 8.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (optional, for caching)

### Environment Variables

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tosho_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Performance tests completed
- [ ] Security scan completed
- [ ] Load testing completed

### Production Deployment
- [ ] Database backed up
- [ ] Deployment pipeline tested
- [ ] Rollback plan prepared
- [ ] Health checks configured
- [ ] Monitoring alerts set up
- [ ] Team notified of deployment

### Post-Deployment
- [ ] Health checks verified
- [ ] Functionality tested
- [ ] Performance metrics reviewed
- [ ] Error logs checked
- [ ] User acceptance testing
- [ ] Documentation updated

## Monitoring & Observability

### Application Monitoring
- **Health Checks**: Built-in health check endpoints
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage patterns and behavior

### Infrastructure Monitoring
- **Server Metrics**: CPU, memory, disk usage
- **Database Performance**: Query performance and connections
- **Network Monitoring**: Latency and availability
- **Security Monitoring**: Authentication and access logs

### Alerting
- **Critical Errors**: Immediate notification for system failures
- **Performance Degradation**: Alerts for slow response times
- **Capacity Issues**: Warnings for resource usage
- **Security Events**: Alerts for suspicious activity

## Scaling Considerations

### Horizontal Scaling
- **Frontend**: Multiple Vercel deployments with load balancing
- **Backend**: Multiple NestJS instances with load balancer
- **Database**: Read replicas for improved performance
- **Caching**: Redis cluster for session and data caching

### Vertical Scaling
- **Server Resources**: CPU and memory upgrades
- **Database**: Higher-tier database instances
- **Storage**: SSD upgrades for better I/O performance
- **Network**: Enhanced bandwidth allocation

### Performance Optimization
- **Frontend**: Code splitting, image optimization, CDN usage
- **Backend**: Database query optimization, caching strategies
- **Database**: Index optimization, query performance tuning
- **Network**: Content compression, connection pooling

## Security Best Practices

### Application Security
- **Input Validation**: All user inputs validated and sanitized
- **Authentication**: Secure JWT implementation
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit

### Infrastructure Security
- **Network Security**: Firewall rules and VPC configuration
- **Access Control**: SSH key management and restricted access
- **Certificate Management**: Automated SSL certificate renewal
- **Vulnerability Management**: Regular security updates

### Compliance
- **Data Privacy**: GDPR and local privacy law compliance
- **Educational Data**: Special considerations for student data
- **Audit Logging**: Comprehensive audit trail
- **Data Retention**: Appropriate data retention policies

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Daily automated backups with point-in-time recovery
- **Application Backups**: Source code in version control
- **Configuration Backups**: Infrastructure as code
- **Data Export**: Regular data exports for compliance

### Recovery Procedures
- **Service Restoration**: Step-by-step service recovery procedures
- **Data Recovery**: Database restoration from backups
- **Infrastructure Recovery**: Infrastructure recreation procedures
- **Communication Plan**: Stakeholder communication during outages

### Business Continuity
- **Maintenance Windows**: Planned maintenance scheduling
- **Rollback Procedures**: Quick rollback for failed deployments
- **Alternative Access**: Offline access capabilities when possible
- **Documentation**: Updated emergency procedures

## Troubleshooting

### Common Issues
- **[Deployment Failures](./troubleshooting/deployment-failures.md)** - Common deployment problems
- **[Performance Issues](./troubleshooting/performance-issues.md)** - Performance troubleshooting
- **[Database Issues](./troubleshooting/database-issues.md)** - Database-related problems
- **[Network Issues](./troubleshooting/network-issues.md)** - Connectivity and network problems

### Diagnostic Tools
- **Health Check Endpoints**: Real-time system status
- **Log Analysis**: Centralized logging and analysis
- **Performance Profiling**: Application performance analysis
- **Database Monitoring**: Query performance and optimization

### Emergency Procedures
- **Incident Response**: Step-by-step incident handling
- **Escalation Procedures**: When and how to escalate issues
- **Communication Templates**: Pre-written incident communications
- **Recovery Validation**: Post-incident verification procedures

## Support and Maintenance

### Regular Maintenance
- **Security Updates**: Regular dependency and security updates
- **Performance Monitoring**: Ongoing performance analysis
- **Capacity Planning**: Resource usage trending and planning
- **Documentation Updates**: Keeping deployment docs current

### Team Responsibilities
- **Development Team**: Code deployment and application issues
- **DevOps Team**: Infrastructure and deployment pipeline
- **Database Team**: Database performance and optimization
- **Security Team**: Security monitoring and compliance

### External Support
- **Platform Support**: Cloud provider technical support
- **Third-party Services**: Monitoring and security service support
- **Community Support**: Open source community resources
- **Professional Services**: Consulting and specialized support