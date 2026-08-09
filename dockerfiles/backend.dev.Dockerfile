FROM maven:3.9-eclipse-temurin-21-alpine

WORKDIR /app

# Cache Maven dependencies
COPY backend/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B

# Copy Java backend source code
COPY backend/src ./src

EXPOSE 8085

CMD ["mvn", "spring-boot:run"]
