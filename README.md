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


### Pruebas automatizadas y cobertura

El frontend cuenta con una suite de pruebas automatizadas ejecutada con Vitest y las herramientas de testing de Angular.

**Última ejecución reportada:**
- Archivos de prueba: 5 aprobados.
- Pruebas: 98 aprobadas de 98 ejecutadas.
- Statements: 94.94%.
- Branches: 92.89%.
- Functions: 90.35%.
- Lines: 96.81%.

#### Distribución de pruebas

| Suite | Pruebas |
|---|---:|
| App | 1 |
| ProductService | 6 |
| ProductFormComponent | 55 |
| Validadores de ProductForm | 9 |
| ProductListComponent | 27 |
| **Total** | **98** |

#### Cobertura por área

| Archivo / área | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| App | 100% | 90% | 100% | 100% |
| ProductService | 100% | 100% | 100% | 100% |
| ProductForm HTML | 89.44% | 89.47% | 88.88% | 92% |
| ProductForm TypeScript | 95.45% | 90.69% | 91.66% | 95.75% |
| Validadores ProductForm | 100% | 100% | 100% | 100% |
| ProductList HTML | 96.09% | 100% | 70.58% | 100% |
| ProductList TypeScript | 98.01% | 96.87% | 96.55% | 98.91% |

#### Ejecutar las pruebas

Desde la carpeta del frontend:

```bash
npm run test:coverage
```

El comando ejecuta las pruebas y genera el reporte de cobertura configurado por el proyecto.


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

### Automated Tests and Coverage

The frontend includes an automated test suite executed with Vitest and Angular testing utilities.

**Latest reported execution:**
- Test files: 5 passed.
- Tests: 98 passed out of 98 executed.
- Statements: 94.94%.
- Branches: 92.89%.
- Functions: 90.35%.
- Lines: 96.81%.

#### Test distribution

| Suite | Tests |
|---|---:|
| App | 1 |
| ProductService | 6 |
| ProductFormComponent | 55 |
| ProductForm validators | 9 |
| ProductListComponent | 27 |
| **Total** | **98** |

#### Coverage by area

| File / area | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| App | 100% | 90% | 100% | 100% |
| ProductService | 100% | 100% | 100% | 100% |
| ProductForm HTML | 89.44% | 89.47% | 88.88% | 92% |
| ProductForm TypeScript | 95.45% | 90.69% | 91.66% | 95.75% |
| ProductForm validators | 100% | 100% | 100% | 100% |
| ProductList HTML | 96.09% | 100% | 70.58% | 100% |
| ProductList TypeScript | 98.01% | 96.87% | 96.55% | 98.91% |

#### Run the tests

From the frontend directory:

```bash
npm run test:coverage
```

This command runs the test suite and generates the coverage report configured by the project.

