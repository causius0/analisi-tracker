# Infrastructure Overview - Analisi Tracker

Complete architectural overview of the production infrastructure.

## Table of Contents

1. [Architecture Diagram](#architecture-diagram)
2. [Technology Stack](#technology-stack)
3. [Infrastructure Components](#infrastructure-components)
4. [Network Architecture](#network-architecture)
5. [Data Flow](#data-flow)
6. [Scalability Strategy](#scalability-strategy)
7. [Security Architecture](#security-architecture)
8. [Disaster Recovery](#disaster-recovery)
9. [Cost Optimization](#cost-optimization)

---

## Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users                                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CDN / Load Balancer                        │
│                    (Cloudflare / AWS ALB)                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
        ┌───────────────────────┐   ┌───────────────────────┐
        │     Nginx / Vercel    │   │  Static Asset CDN     │
        │   (Reverse Proxy)     │   │  (Vercel/Cloudflare)  │
        └───────────────────────┘   └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Application Server   │
        │   (Node.js/Express)   │
        │   Port: 3000          │
        └───────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Redis   │   │  App    │   │  App    │
│ (Cache) │   │ Instance│   │ Instance│
└─────────┘   └─────────┘   └─────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  Monitoring   │
                            │  (Sentry +    │
                            │   Prometheus) │
                            └───────────────┘
```

---

## Technology Stack

### Application Layer

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** JavaScript (ES6+)
- **Package Manager:** npm

### Frontend

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Chart.js, Recharts
- **State:** Zustand

### Caching Layer

- **Cache:** Redis 7
- **Session Store:** Redis
- **Job Queue:** Bull (Redis-backed)

### Deployment

#### Option A: Vercel
- **Platform:** Serverless Functions
- **CDN:** Vercel Edge Network
- **Database:** Managed Redis (Redis Cloud)

#### Option B: Docker
- **Containerization:** Docker
- **Orchestration:** Docker Compose (can upgrade to Kubernetes)
- **Reverse Proxy:** Nginx
- **Process Manager:** Docker restart policies

### Monitoring & Observability

- **Error Tracking:** Sentry
- **Metrics:** Prometheus
- **Logging:** JSON logs + Docker logs
- **Uptime:** UptimeRobot/Pingdom
- **APM:** Optional (New Relic/DataDog)

### Development Tools

- **Version Control:** Git
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint
- **Testing:** Jest

---

## Infrastructure Components

### 1. Application Server

**Purpose:** Hosts the Express.js application and serves API requests.

**Specifications:**
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Storage: 20GB SSD
- OS: Ubuntu 20.04+ or Alpine Linux (Docker)

**Responsibilities:**
- Serve REST API endpoints
- Process analytics computations
- Handle data import/export
- Manage PDF processing
- Implement rate limiting
- Serve health checks

**Scaling:** Horizontal (add more instances behind load balancer)

### 2. Redis Server

**Purpose:** Caching and job queue management.

**Specifications:**
- CPU: 1 core minimum
- RAM: 2GB+ (depends on cache size)
- Storage: 10GB+ (for persistence)
- Max Memory: 1.5GB (with eviction policy)

**Use Cases:**
- API response caching
- Session storage
- Job queue (Bull)
- Real-time analytics
- Rate limiting counters

**Persistence:** AOF (Append Only File) enabled

**Eviction Policy:** allkeys-lru

### 3. Nginx Reverse Proxy (Docker only)

**Purpose:** Load balancing, SSL termination, static file serving.

**Configuration:**
- Worker processes: auto
- Worker connections: 2048
- Keep-alive: 65
- Gzip: enabled

**Features:**
- SSL/TLS termination
- HTTP/2 support
- Static file caching
- Rate limiting
- Security headers
- Request logging

### 4. CDN Layer (Vercel or Cloudflare)

**Purpose:** Global content delivery and DDoS protection.

**Features:**
- Edge caching
- DDoS protection
- Web Application Firewall (WAF)
- Bot protection
- SSL/TLS certificates
- Global PoPs (Points of Presence)

---

## Network Architecture

### Ports

| Port | Service        | External Access |
|------|----------------|-----------------|
| 80   | HTTP           | Yes (redirect)  |
| 443  | HTTPS          | Yes             |
| 3000 | Application    | No (internal)   |
| 6379 | Redis          | No (internal)   |

### Firewall Rules (Docker deployment)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny everything else
sudo ufw enable
```

### DNS Configuration

```
# Production
A    analisi-tracker.com     SERVER_IP
A    www.analisi-tracker.com SERVER_IP

# Staging
A    staging.analisi-tracker.com STAGING_SERVER_IP

# CDN (if using Cloudflare)
CNAME analisi-tracker.com    your-site.cloudflare.net
```

---

## Data Flow

### 1. User Request Flow

```
1. User → CDN → Check cache
2. CDN → Nginx (if cache miss)
3. Nginx → App server (port 3000)
4. App server → Redis (check cache)
5. App server → Process request
6. App server → Redis (store result)
7. App server → Nginx → CDN → User
```

### 2. Analytics Computation Flow

```
1. User requests analytics
2. App server checks Redis cache
3. If cache hit: Return cached result
4. If cache miss:
   a. Fetch data from source
   b. Perform computations (trends, correlations, etc.)
   c. Store in Redis (with TTL)
   d. Return result to user
```

### 3. Data Import Flow

```
1. User uploads file (PDF/CSV)
2. App server validates file
3. Parse file content
4. Extract data points
5. Store in Redis/Database
6. Invalidate relevant caches
7. Return success response
```

---

## Scalability Strategy

### Vertical Scaling (Scale Up)

**Current:** 2 CPU, 4GB RAM
**Upgrade path:**
- 4 CPU, 8GB RAM (2x)
- 8 CPU, 16GB RAM (4x)

**When to use:**
- Single instance deployment
- Simpler infrastructure
- Cost-effective for moderate traffic

### Horizontal Scaling (Scale Out)

**Architecture:**
```
        Load Balancer
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  App 1     App 2     App 3
    │         │         │
    └─────────┼─────────┘
              ▼
         Shared Redis
```

**Implementation:**
- Use load balancer (Nginx/HAProxy/AWS ALB)
- Deploy multiple app instances
- Shared Redis for cache/sessions
- Stateless application design

**When to use:**
- High traffic (>1000 concurrent users)
- Need high availability
- Better fault tolerance

### Caching Strategy

**Multi-level caching:**
1. CDN cache (static assets)
2. Redis cache (API responses)
3. Application cache (in-memory)

**Cache invalidation:**
- TTL-based expiration
- Manual invalidation on updates
- Cache versioning for major changes

---

## Security Architecture

### 1. Network Security

- **Firewall:** UFW or cloud provider firewall
- **DDoS Protection:** Cloudflare or Vercel
- **SSL/TLS:** Let's Encrypt or managed certificates
- **Port Security:** Only 80/443 exposed

### 2. Application Security

- **CORS:** Configured for specific domains
- **Rate Limiting:** 100 requests per 15 minutes
- **Input Validation:** Sanitize all user inputs
- **SQL Injection:** Use parameterized queries
- **XSS Protection:** Content Security Policy headers

### 3. Data Security

- **Passwords:** Never stored, use bcrypt
- **API Keys:** Environment variables only
- **Sensitive Data:** Encrypted at rest
- **Logs:** Sanitized (no passwords/tokens)

### 4. Authentication & Authorization

- **JWT:** For API authentication
- **Session Management:** Redis-backed
- **RBAC:** Role-based access control (if applicable)

---

## Disaster Recovery

### Backup Strategy

**Frequency:** Daily automated backups
**Retention:** 30 days
**Storage:** Off-site (S3 or similar)

**What gets backed up:**
- Redis snapshots
- Application logs
- User uploads (if applicable)
- Configuration files

### High Availability

**Current:** Single instance (manual failover)
**Upgrade path:**
- Multi-AZ deployment (cloud)
- Database replication (PostgreSQL)
- Redis clustering
- Load-balanced app instances

### Recovery Time Objectives (RTO)

- **Application restart:** 5 minutes
- **Redis restore:** 15 minutes
- **Full disaster recovery:** 1 hour

### Recovery Point Objectives (RPO)

- **Data loss tolerance:** 24 hours
- **Backup frequency:** Daily
- **Maximum data loss:** 1 day

---

## Cost Optimization

### Current Costs (Estimated)

#### Vercel Deployment
- **Hobby Plan:** Free
- **Pro Plan:** $20/month
- **Enterprise:** Custom

#### Docker Deployment (Self-hosted)
- **Server (2 CPU, 4GB):** $20-40/month
- **Redis (managed):** $15-30/month
- **Domain:** $10-15/year
- **SSL:** Free (Let's Encrypt)
- **Monitoring:** Free tier

**Total:** ~$50-100/month

### Cost Optimization Strategies

1. **Use free tiers:**
   - Vercel Hobby plan
   - Redis Cloud free tier
   - Sentry free tier

2. **Optimize caching:**
   - Increase cache hit rate
   - Longer TTL for static data
   - CDN for static assets

3. **Right-size resources:**
   - Monitor actual usage
   - Scale down when appropriate
   - Use burstable instances

4. **Reserved instances:**
   - Pre-pay for 1 year (20-30% discount)
   - Use spot instances for non-critical workloads

---

## Monitoring Strategy

### Metrics to Monitor

**Application Metrics:**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active connections
- Cache hit rate

**System Metrics:**
- CPU usage
- Memory usage
- Disk usage
- Network I/O

**Business Metrics:**
- Active users
- Analytics computations
- Data imports
- Export operations

### Alert Thresholds

**Critical (page engineer immediately):**
- Application down (health check fails)
- Error rate > 10%
- Response time p95 > 5 seconds
- Disk usage > 90%

**Warning (investigate within 1 hour):**
- Error rate > 5%
- Response time p95 > 2 seconds
- Memory usage > 80%
- CPU usage > 80%

---

## Future Improvements

### Short-term (1-3 months)

- [ ] Add PostgreSQL for persistent storage
- [ ] Implement automated tests
- [ ] Set up staging environment
- [ ] Add CI/CD pipeline
- [ ] Implement feature flags

### Medium-term (3-6 months)

- [ ] Migrate to Kubernetes
- [ ] Add database replication
- [ ] Implement Redis clustering
- [ ] Add APM (Application Performance Monitoring)
- [ ] Set up log aggregation (ELK stack)

### Long-term (6-12 months)

- [ ] Multi-region deployment
- [ ] Implement service mesh
- [ ] Add GraphQL API
- [ ] Real-time analytics with WebSockets
- [ ] Machine learning pipeline

---

## Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Rollback Guide](./ROLLBACK_GUIDE.md)
- [Backup Procedures](./scripts/README.md)

---

**Last Updated:** 2024-01-01
**Version:** 1.0.0
**Maintained By:** DevOps Team
