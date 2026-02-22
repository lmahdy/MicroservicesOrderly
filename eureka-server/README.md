# Eureka Server - ORDERLY

Serveur de découverte de services pour les microservices ORDERLY (port **8761**).

## Lancer le serveur

À la racine du projet (parent de `eureka-server`) :

```bash
.\mvnw.cmd -f eureka-server\pom.xml spring-boot:run
```

Ou depuis le dossier `eureka-server` (si Maven est installé) :

```bash
cd eureka-server
mvn spring-boot:run
```

## Dashboard

- **URL** : http://localhost:8761

## Ordre de démarrage

1. Démarrer **Eureka Server** en premier (port 8761).
2. Puis démarrer **product-service** (port 8093) : il s'enregistrera automatiquement.
