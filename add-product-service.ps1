# Script: mettre ton code dans services/product-service/ SUR TA BRANCHE product-service
# Pas de main, pas de merge - juste reorganisation sur product-service

$ErrorActionPreference = "Stop"

Write-Host "1. Passage sur la branche product-service..."
git fetch origin
git checkout product-service
git pull origin product-service

Write-Host "2. Creation du dossier services/product-service..."
New-Item -ItemType Directory -Path "services/product-service" -Force | Out-Null

Write-Host "3. Deplacement de ton code dans services/product-service..."
Move-Item -Path "pom.xml" -Destination "services/product-service/" -Force
Move-Item -Path "src" -Destination "services/product-service/" -Force
Move-Item -Path ".mvn" -Destination "services/product-service/" -Force
Move-Item -Path "mvnw" -Destination "services/product-service/" -Force
Move-Item -Path "mvnw.cmd" -Destination "services/product-service/" -Force

# .gitignore et .gitattributes : copier dans le sous-dossier (garder une copie a la racine si tu veux, ou les deplacer)
if (Test-Path ".gitignore") {
    Copy-Item -Path ".gitignore" -Destination "services/product-service/.gitignore" -Force
}
if (Test-Path ".gitattributes") {
    Copy-Item -Path ".gitattributes" -Destination "services/product-service/.gitattributes" -Force
}

Write-Host "4. Ajout et commit sur product-service..."
git add -A
git status
git commit -m "Move product-service into services/product-service/"

Write-Host "5. Push de la branche product-service..."
git push origin product-service

Write-Host "Termine. Ta branche product-service a maintenant le code dans services/product-service/"
