# ═══════════════════════════════════════════════════════════════════════════════
# Dockerfile — Spring Boot Service (used by ALL 7 microservices)
# Copy this file into each service directory: auth-service/, user-service/, etc.
#
# Build strategy: multi-stage
#   Stage 1 (build):   Maven compiles the code and produces a fat JAR
#   Stage 2 (runtime): Alpine JRE runs the JAR with minimal footprint
#
# Result: ~180 MB image vs ~500 MB if using full JDK at runtime
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build

WORKDIR /build

# Copy pom.xml first — Docker caches this layer.
# Dependencies are only re-downloaded when pom.xml changes (not on code changes).
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source code and build
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# Security: run as non-root user
RUN addgroup -S shopflow && adduser -S shopflow -G shopflow

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /build/target/*.jar app.jar

# Change ownership
RUN chown shopflow:shopflow app.jar

USER shopflow

# JVM flags:
#   -Xms64m                  start with 64 MB heap
#   -Xmx128m                 never exceed 128 MB heap (critical for t2.micro)
#   -XX:+UseContainerSupport respect Docker memory limits
#   -XX:MaxRAMPercentage=75  use up to 75% of container memory
#   -Djava.security.egd=...  faster startup (avoids entropy wait)
ENV JAVA_OPTS="-Xms64m -Xmx128m -XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -Djava.security.egd=file:/dev/./urandom \
               -Dspring.backgroundpreinitializer.ignore=true"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# ── Notes ─────────────────────────────────────────────────────────────────────
# Each service exposes its own port via Spring Boot (configured in application.yml)
# The port is NOT declared with EXPOSE here — docker-compose handles port mapping.
#
# To build a specific service manually:
#   cd auth-service && docker build -t shopflow/auth-service:latest .
#
# To build all services via docker-compose:
#   docker-compose build
