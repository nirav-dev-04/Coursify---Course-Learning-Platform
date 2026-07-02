# Stage 1: Build stage
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Package project
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose local port (Render will override dynamic binding, but good practice)
EXPOSE 5001

ENTRYPOINT ["java", "-jar", "app.jar"]
