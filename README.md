
# 🛍️ Jeans For Jeans — Enterprise E-Commerce Microservices Platform

An enterprise-grade, event-driven e-commerce platform built with a **Distributed Microservices Architecture** using **Spring Boot 3**, **Spring Cloud (Gateway, Eureka)**, **MySQL**, **RabbitMQ**, and a modern **React (Vite) + Tailwind CSS** frontend.

The platform provides comprehensive online shopping workflows, fine-grained Role-Based Access Control (RBAC), real-time updates via **Server-Sent Events (SSE)**, dynamic hierarchical categories, inventory reservation, and cloud-based media storage via **Supabase**.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Microservices Ecosystem](#-microservices-ecosystem)
- [Docker Images](#-docker-images)
- [Key Features](#-key-features)
  - [1. Security & Real-Time Identity Management (IAM)](#1-security--real-time-identity-management-iam)
  - [2. Products & Hierarchical Categories](#2-products--hierarchical-categories)
  - [3. Shopping Cart, Orders & Stock Reservation](#3-shopping-cart-orders--stock-reservation)
  - [4. Multi-Role Dashboards](#4-multi-role-dashboards)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Database Setup](#-database-setup)
- [Running the Services (Step-by-Step)](#-running-the-services-step-by-step)
- [Default Ports Reference](#-default-ports-reference)
- [License](#-license)

---

## 🏛️ Architecture Overview

The system strictly adheres to the **Database-per-Service** design pattern to decouple bounded contexts, maximize availability, and allow independent scaling.

```text
                         ┌────────────────────────┐
                         │   React 18 Frontend    │
                         │     (Vite + Tailwind)  │
                         └───────────┬────────────┘
                                     │ :5173
                                     ▼
                         ┌────────────────────────┐
                         │  Spring Cloud Gateway  │
                         │         :8085          │
                         └───────────┬────────────┘
                                     │
       ┌───────────────────┬─────────┴─────────┬───────────────────┐
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │ Product Service │ │  Order Service  │ │  User Service   │
│      :8081      │ │      :8083      │ │      :8084      │ │      :8092      │
│  (MySQL + SSE)  │ │     (MySQL)     │ │     (MySQL)     │ │     (MySQL)     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         └───────────────────┴─────────┬─────────┴───────────────────┘
                                       │
                                       ▼
                         ┌────────────────────────┐
                         │ Eureka Service Registry│
                         │         :8761          │
                         └────────────────────────┘
```

---

## 📦 Microservices Ecosystem

| Microservice | Port | Description & Responsibilities |
| :--- | :---: | :--- |
| **`eureka-server`** | `8761` | Service Registry & Discovery for seamless inter-service lookup and dynamic client-side load balancing (`lb://`). |
| **`gateway`** | `8085` | Reverse proxy edge gateway handling routing, global CORS policies, JWT validation filter, and route authorization checks. |
| **`auth-service`** | `8081` | Authentication, JWT rotation, Password Reset, Employee RBAC, dynamic permissions, and real-time Server-Sent Events (SSE). |
| **`product-service`** | `8083` | Catalogue management, multi-variant stock (`XS`, `S`, `M`, `L`, `XL`), parent-child hierarchical categories, and image metadata. |
| **`order-service`** | `8084` | Shopping cart persistence, stock reservation, checkout lifecycle, and order processing. |
| **`user-services`** | `8092` | Customer profile information, delivery addresses, and customer data management. |
| **`cart-service`** | `8086` | Shopping cart operations and cart management. |
| **`frontend`** | `5173` | Responsive Single Page Application (SPA) offering customer storefronts and dedicated Admin / Employee management portals. |

---

## 🐳 Docker Images

All project services are containerized using Docker and published to Docker Hub.

The Docker images are built and pushed automatically using **GitHub Actions CI/CD**, eliminating the need for local Docker builds.

### Published Docker Images

| Component | Docker Hub Image |
| :--- | :--- |
| Auth Service | [omarnoureldeen/auth-service](https://hub.docker.com/r/omarnoureldeen/auth-service) |
| Cart Service | [omarnoureldeen/cart-service](https://hub.docker.com/r/omarnoureldeen/cart-service) |
| Eureka Server | [omarnoureldeen/eureka-server](https://hub.docker.com/r/omarnoureldeen/eureka-server) |
| API Gateway | [omarnoureldeen/gateway](https://hub.docker.com/r/omarnoureldeen/gateway) |
| Order Service | [omarnoureldeen/order-service](https://hub.docker.com/r/omarnoureldeen/order-service) |
| Product Service | [omarnoureldeen/product-service](https://hub.docker.com/r/omarnoureldeen/product-service) |
| User Service | [omarnoureldeen/user-services](https://hub.docker.com/r/omarnoureldeen/user-services) |
| Frontend | [omarnoureldeen/jeans-frontend](https://hub.docker.com/r/omarnoureldeen/jeans-frontend) |

### CI/CD Pipeline

- **GitHub Actions:** Automatically triggers the Docker build-and-push workflow on every push to the `main` branch.
- **Multi-Stage Docker Builds:** Maven builds the Spring Boot applications inside Docker build stages, producing optimized runtime images.
- **Docker Hub:** Publishes the resulting images to their respective repositories.
- **Frontend Containerization:** Uses a multi-stage build with Node.js and Nginx.

**Docker Hub Profile:** [View all published images](https://hub.docker.com/u/omarnoureldeen)

---

## 🚀 Key Features

### 1. Security & Real-Time Identity Management (IAM)

- **Stateless JWT + Refresh Token Rotation:** Highly secure token lifecycle with automated Axios interceptors refreshing expired tokens transparently.
- **Granular RBAC & Dynamic Permissions:** Beyond static roles (`ADMIN`, `EMPLOYEE`, `USER`), employees possess customizable granular privileges (e.g., `product:create`, `category:delete`, `order:update`).
- **⚡ Real-Time Push via Server-Sent Events (SSE):**
  - **Zero-Polling Permission Sync:** Permission edits propagate instantly across different browsers and active tabs without polling the server.
  - **Instant Revocation & Forced Logout:** Deleting an employee immediately notifies their browser over the SSE channel, wiping local credentials and redirecting to `/login`.

### 2. Products & Hierarchical Categories

- **100% Database-Driven Category Hierarchy:** Self-referencing tree structure supporting Main Categories (`parentId = NULL`) and linked Subcategories.
- **Relational Integrity Protection:** Built-in safeguards prevent accidental deletion of categories that have active products assigned.
- **Variant & Inventory Matrix:** Product sizes and specific stock quantities are validated and tracked independently.
- **Supabase Cloud Media Storage:** Direct multiple-image uploads to Supabase Storage buckets with cover-image assignment.

### 3. Shopping Cart, Orders & Stock Reservation

- **Concurrency & Inventory Reservation:** Products added to active checkouts reserve stock to prevent overselling.
- **Full Order Lifecycle:** Complete state machine tracking: `PENDING` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED` / `CANCELLED`.
- **Dynamic Catalogue Filtering:** Real-time customer search, multi-category selection, price range filters, and responsive sorting.

### 4. Multi-Role Dashboards

- **Super Admin Dashboard:** KPI metrics (Revenue, Orders, Products, Users), employee access control, full catalogue oversight, and category hierarchy editor.
- **Adaptive Employee Portal:** The employee's sidebar and accessible pages dynamically adapt based on granted permissions.

---

## 🛠️ Tech Stack

### Backend

- **Core:** Java 17, Spring Boot 3.x
- **Spring Cloud:** Spring Cloud Gateway, Netflix Eureka Discovery Client & Server
- **Security:** Spring Security 6, JWT (JSON Web Tokens), BCrypt
- **Real-Time:** Spring Web MVC `SseEmitter` with automated keep-alive heartbeats
- **Messaging:** RabbitMQ
- **Database & Persistence:** MySQL 8, Spring Data JPA, Hibernate, HikariCP
- **Build Tool:** Apache Maven (`mvnw`)

### Frontend

- **Framework & Tooling:** React 18, Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **State Management:** React Context API (`AuthContext`, `ShopContext`)
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios (configured with request/response interceptors)
- **Cloud Storage:** Supabase JavaScript Client SDK
- **Notifications:** React-Toastify

---

## ⚙️ Prerequisites

Ensure you have the following installed locally:

1. **Java Development Kit (JDK 17 or higher)**
2. **Node.js (v18.x or higher) & npm**
3. **MySQL Server 8.x** running on port `3306`
4. **RabbitMQ Server** (Optional for basic flow, recommended for full async events)

---

## 🗄️ Database Setup

Create the required MySQL databases for each microservice:

```sql
CREATE DATABASE IF NOT EXISTS `auth-service`;
CREATE DATABASE IF NOT EXISTS `product-service`;
CREATE DATABASE IF NOT EXISTS `order-service`;
CREATE DATABASE IF NOT EXISTS `user-services`;
```

> **Note:** Check `application.properties` in each microservice directory to configure your MySQL username and password (default: `root` / `root` or `password`).

---

## 🏃 Running the Services (Step-by-Step)

Start the microservices in the following recommended order to ensure proper service registration.

### 1️⃣ Start Eureka Discovery Server

```powershell
cd eureka-server
.\mvnw.cmd spring-boot:run
```

*Eureka Dashboard will be available at:* `http://localhost:8761`

### 2️⃣ Start API Gateway

```powershell
cd gateway
.\mvnw.cmd spring-boot:run
```

*Gateway will listen on:* `http://localhost:8085`

### 3️⃣ Start Core Microservices

Open separate terminal windows for each service.

**Auth Service:**

```powershell
cd auth-service
.\mvnw.cmd spring-boot:run
```

**Product Service:**

```powershell
cd product-service
.\mvnw.cmd spring-boot:run
```

**Order Service:**

```powershell
cd order-service
.\mvnw.cmd spring-boot:run
```

**User Service:**

```powershell
cd user-services
.\mvnw.cmd spring-boot:run
```

**Cart Service:**

```powershell
cd cart-service
.\mvnw.cmd spring-boot:run
```

### 4️⃣ Start Frontend Application

```powershell
cd frontend
npm install
npm run dev
```

*Frontend application will run at:* `http://localhost:5173`

---

## 🔌 Default Ports Reference

| Component | Port | Health / URL |
| :--- | :---: | :--- |
| **Eureka Server** | `8761` | [http://localhost:8761](http://localhost:8761) |
| **API Gateway** | `8085` | [http://localhost:8085](http://localhost:8085) |
| **Auth Service** | `8081` | [http://localhost:8081](http://localhost:8081) |
| **Cart Service** | `8086` | [http://localhost:8086](http://localhost:8086) |
| **User Service** | `8092` | [http://localhost:8092](http://localhost:8092) |
| **Product Service** | `8083` | [http://localhost:8083](http://localhost:8083) |
| **Order Service** | `8084` | [http://localhost:8084](http://localhost:8084) |
| **Frontend (Vite SPA)** | `5173` | [http://localhost:5173](http://localhost:5173) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
