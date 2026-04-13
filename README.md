# Orderly — Microservices Ordering Platform

A full-stack microservices application for managing orders, deliveries, and notifications. Built with Spring Boot, Spring Cloud, Angular, and Docker.

---

## Architecture Overview

```
                          ┌─────────────────┐
                          │   Frontend       │
                          │  (Angular:4200)  │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │   API Gateway    │
                          │  (Spring:9016)   │
                          │  JWT Validation  │
                          └────────┬─────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                   │
         ┌──────▼──────┐  ┌───────▼───────┐  ┌───────▼───────┐
         │ User Service │  │ Order Service │  │ Store Service │
         │   (8090)     │  │   (8084)      │  │   (8094)      │
         └──────────────┘  └───────┬───────┘  └───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │ SYNC (Feign) │ ASYNC (AMQP) │
                    ▼              ▼               ▼
            ┌──────────────┐ ┌──────────┐ ┌───────────────┐
            │Product Service│ │Complaint │ │ Notification  │
            │   (8093)      │ │ Service  │ │   Service     │
            └──────────────┘ │  (8086)  │ │   (8087)      │
                             └──────────┘ └───────────────┘
                                              ▲
                    ┌─────────────────────────┘
                    │ ASYNC (AMQP)
            ┌───────┴───────┐
            │Delivery Service│
            │   (8085)       │
            └────────────────┘
```

### Infrastructure

| Component | Port | Technology | Role |
|-----------|------|------------|------|
| **Eureka** | 8761 | Spring Cloud Netflix | Service discovery and registration |
| **Config Server** | 8888 | Spring Cloud Config | Centralized configuration (native) |
| **API Gateway** | 9016 | Spring Cloud Gateway | Routing, JWT validation, CORS |
| **Keycloak** | 9090 | Keycloak 23.0 | Authentication & authorization (OAuth2/JWT) |
| **RabbitMQ** | 5672 / 15672 | RabbitMQ 3 | Asynchronous messaging |
| **MySQL** | 3307 | MySQL 8.0 | Persistent storage (User, Delivery, Complaint) |
| **MongoDB** | 27017 | MongoDB 7 | Document storage (Notification) |

### Business Services

| Service | Port | Database | Language | Description |
|---------|------|----------|----------|-------------|
| **user-service** | 8090 | MySQL | Java/Spring Boot | User management, Keycloak integration |
| **store-service** | 8094 | H2 | Java/Spring Boot | Store management |
| **product-service** | 8093 | H2 | Java/Spring Boot | Product catalog |
| **order-service** | 8084 | H2 | Java/Spring Boot | Order management (central service) |
| **delivery-service** | 8085 | MySQL | Java/Spring Boot | Delivery tracking |
| **complaint-service** | 8086 | MySQL | Java/Spring Boot | Complaint handling |
| **notification-service** | 8087 | MongoDB | NestJS/TypeScript | Real-time notifications |
| **frontend** | 4200 | — | Angular | Web application |

---

## Communication Patterns

### Synchronous (REST)

| From | To | Mechanism | Purpose |
|------|----|-----------|---------|
| Frontend | Gateway | HTTP/REST | All client requests |
| Gateway | All services | Load-balanced routing (`lb://`) | Request forwarding via Eureka |
| Order Service | Product Service | **OpenFeign** | Validate products & fetch prices |
| Delivery Service | Order Service | **RestTemplate** (via Gateway) | Update order status on delivery |

### Asynchronous (RabbitMQ)

| Exchange | Type | Producer | Consumers | Trigger |
|----------|------|----------|-----------|---------|
| `ORDER_CREATED_EXCHANGE` | Fanout | Order Service | Complaint Service, Notification Service | New order created |
| `DELIVERY_EVENTS_EXCHANGE` | Topic | Delivery Service | Notification Service | Delivery status changes |

**Routing keys** for delivery events: `delivery.ASSIGNED`, `delivery.PICKED_UP`, `delivery.ON_THE_WAY`, `delivery.DELIVERED`

---

## Security

- **Identity Provider**: Keycloak (OAuth2 / OpenID Connect)
- **Realm**: `orderly`
- **Client**: `orderly-frontend` (public client)
- **Roles**: `ADMIN`, `CLIENT`, `LIVREUR`
- **Token**: JWT validated at Gateway level and by each microservice independently
- **JWT propagation**: Feign calls propagate the JWT token via `RequestInterceptor`

### Pre-configured Users

| Username | Password | Role |
|----------|----------|------|
| admin1 | admin | ADMIN |
| admin@orderly.tn | admin | ADMIN |
| client1 | client | CLIENT |
| delivery1 | delivery | LIVREUR |

---

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.4, Spring Cloud 2024.0
- **Frontend**: Angular, TypeScript
- **Notification Service**: NestJS, TypeScript
- **Databases**: MySQL 8, MongoDB 7, H2 (in-memory)
- **Messaging**: RabbitMQ 3 (AMQP)
- **Security**: Keycloak 23, OAuth2, JWT
- **Service Discovery**: Netflix Eureka
- **Configuration**: Spring Cloud Config (native)
- **Gateway**: Spring Cloud Gateway (reactive)
- **Containerization**: Docker, Docker Compose
- **Build**: Maven, npm

---

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Run the entire stack

```bash
docker-compose up --build
```

This starts all 13 containers with health checks and ordered startup:

1. **Databases**: MySQL, MongoDB
2. **Infrastructure**: RabbitMQ, Keycloak, Eureka
3. **Config Server**
4. **Gateway**
5. **Business Services**: user, store, product, order, delivery, complaint, notification
6. **Frontend**

### Access the services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| API Gateway | http://localhost:9016 |
| Eureka Dashboard | http://localhost:8761 |
| Keycloak Admin | http://localhost:9090 (admin / admin) |
| RabbitMQ Management | http://localhost:15672 (guest / guest) |
| Swagger (Order) | http://localhost:8084/swagger-ui.html |
| H2 Console (Order) | http://localhost:8084/h2-console |

### Get a JWT token

```bash
curl -X POST http://localhost:9090/realms/orderly/protocol/openid-connect/token \
  -d "grant_type=password&client_id=orderly-frontend&username=client1&password=client"
```

### Create an order (example)

```bash
curl -X POST http://localhost:9016/api/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client1",
    "storeId": 1,
    "deliveryAddress": "123 Main Street",
    "items": [
      { "productId": 1, "quantity": 2 }
    ]
  }'
```

---

## Order Service — Central Business Flow

Order Service is the central hub of the application. When an order is created:

1. **Feign (sync)** → Calls Product Service to validate products and fetch real prices
2. **JPA** → Calculates total amount and saves order to H2 database
3. **RabbitMQ (async)** → Publishes `ORDER_CREATED` event
4. **Complaint Service** → Consumes the event, creates a complaint tracking record
5. **Notification Service** → Consumes the event, creates a notification in MongoDB

If RabbitMQ is unavailable, the order is still saved (graceful degradation).

---

## Project Structure

```
├── config-repo/                  # Centralized configuration files (.yml)
├── config-server/                # Spring Cloud Config Server
├── discovery/                    # Eureka Service Discovery
├── gateway/                      # API Gateway (routing, security, CORS)
├── frontend/orderly-frontend/    # Angular frontend
├── services/
│   ├── order-service/            # Order management (Feign + RabbitMQ producer)
│   ├── product-service/          # Product catalog
│   ├── user-service/             # User management + Keycloak
│   ├── store-service/            # Store management
│   ├── delivery-service/         # Delivery tracking (RabbitMQ producer)
│   ├── complaint-service/        # Complaint handling (RabbitMQ consumer)
│   └── notification-service/     # Notifications (RabbitMQ consumer, NestJS)
├── docker-compose.yml            # Orchestrates all 13 containers
├── orderly-realm.json            # Keycloak realm configuration (auto-imported)
└── init-db.sql                   # MySQL database initialization
```

---

## DevOps

- **Containerization**: Each service has its own `Dockerfile` (multi-step build)
- **Orchestration**: `docker-compose.yml` with health checks and dependency ordering
- **Networking**: Docker bridge network — containers communicate via container names
- **Persistent volumes**: `mysql-data`, `mongo-data`, `keycloak-data`
- **Configuration**: Mounted `config-repo/` volume for Config Server
