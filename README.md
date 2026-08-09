# MovieSeat — Cinema Ticketing Platform

MovieSeat is a full-stack cinema seat reservation and ticketing application built with React, TypeScript, Tailwind CSS, Express, Java Spring Boot, and **Prometheus & Grafana** observability.

---

## 🐳 Docker Setup (All Dockerfiles in `/dockerfiles/` Folder)

All Dockerfiles and Docker Compose files are cleanly organized inside the **`dockerfiles`** directory:

```
dockerfiles/
├── frontend.dev.Dockerfile
├── frontend.prod.Dockerfile
├── backend.dev.Dockerfile
├── backend.prod.Dockerfile
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── docker-compose.yml
```

### 1. Development Mode (Hot Reloading)

```bash
# From project root:
docker-compose -f dockerfiles/docker-compose.dev.yml up --build

# Or navigate into the dockerfiles directory:
cd dockerfiles
docker-compose -f docker-compose.dev.yml up -d
```

**Development Endpoints:**
- **Frontend / Fullstack App**: [http://localhost:3000](http://localhost:3000)
- **Java Spring Boot Backend**: [http://localhost:8085](http://localhost:8085)
- **Prometheus UI**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboards**: [http://localhost:3001](http://localhost:3001) (`admin` / `admin`)
- **PostgreSQL Database**: `localhost:5432`

Stop dev environment:
```bash
docker-compose -f dockerfiles/docker-compose.dev.yml down
```

---

### 2. Production Mode

```bash
# From project root:
docker-compose -f dockerfiles/docker-compose.prod.yml up -d --build

# Or from inside dockerfiles directory:
cd dockerfiles
docker-compose up -d --build
```

**Production Endpoints:**
- **MovieSeat Web App**: [http://localhost:3000](http://localhost:3000)
- **Prometheus Metrics**: [http://localhost:3000/metrics](http://localhost:3000/metrics)
- **Prometheus UI**: [http://localhost:9090](http://localhost:9090)
- **Grafana Monitoring**: [http://localhost:3001](http://localhost:3001)

Stop production environment:
```bash
docker-compose -f dockerfiles/docker-compose.prod.yml down
```

---

## 💻 Alternative: Run with Node.js & npm (Without Docker)

**Prerequisites:** Node.js v18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Telemetry & Prometheus Observability

- Real-time Prometheus metrics exporter at `/metrics`.
- Interactive telemetry dashboard built-in at `/telemetry`.
- Pre-configured Grafana dashboards in `grafana/provisioning`.
