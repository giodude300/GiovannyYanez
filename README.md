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

Este comando construye las imágenes e inicia todos los servicios.

### Acceso a los servicios

| Servicio | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3002/bp/products |

### Actualizar el frontend

Si únicamente se realizan cambios en el frontend (Angular), ejecutar:

```bash
docker compose up -d --build --no-deps frontend
```

La opción `--no-deps` evita iniciar o recrear los servicios de los que depende el frontend, como el backend.

**Importante:** El backend almacena los productos en memoria. Si el contenedor del backend se reinicia o se recrea, los datos almacenados se pierden.

### Actualizar el backend

Si se realizan cambios en el backend, ejecutar:

```bash
docker compose up -d --build backend
```

### Detener el proyecto

```bash
docker compose down
```

### Consultar logs

Para consultar los logs de todos los servicios:

```bash
docker compose logs -f
```

Para consultar los logs de un servicio específico:

```bash
docker compose logs -f frontend
```

```bash
docker compose logs -f backend
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

This command builds the images and starts all services.

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3002/bp/products |

### Update the frontend

If only frontend (Angular) changes are made, run:

```bash
docker compose up -d --build --no-deps frontend
```

The `--no-deps` option prevents Docker Compose from starting or recreating the frontend's dependent services, such as the backend.

**Important:** The backend stores products in memory. If the backend container is restarted or recreated, the stored data will be lost.

### Update the backend

If backend changes are made, run:

```bash
docker compose up -d --build backend
```

### Stop the project

```bash
docker compose down
```

### View logs

To view logs from all services:

```bash
docker compose logs -f
```

To view logs from a specific service:

```bash
docker compose logs -f frontend
```

```bash
docker compose logs -f backend
```