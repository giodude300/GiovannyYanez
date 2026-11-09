# GiovannyYanez
Financial Products Management - Technical Assessment

## Español

### Descripción

Aplicación de gestión de productos financieros desarrollada como parte de una evaluación técnica.

El proyecto utiliza Angular para el frontend y Node.js / TypeScript para el backend. Ambos servicios se ejecutan mediante Docker Compose.

### Requisitos

- Docker Desktop.
- Docker Compose.

### Iniciar el proyecto

Desde la raíz del repositorio, ejecutar:

```bash
docker compose up --build -d
```

### Acceso a los servicios

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3002/bp/products |

### Detener el proyecto

```bash
docker compose down
```

### Consultar logs

```bash
docker compose logs -f
```

---

## English

### Description

Financial Products Management is an application developed as part of a technical assessment.

The project uses Angular for the frontend and Node.js / TypeScript for the backend. Both services run using Docker Compose.

### Requirements

- Docker Desktop.
- Docker Compose.

### Start the project

From the repository root, run:

```bash
docker compose up --build -d
```

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3002/bp/products |

### Stop the project

```bash
docker compose down
```

### View logs

```bash
docker compose logs -f
```