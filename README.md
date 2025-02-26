# XAI Demonstrator für einen Controlling Use Case

Ein Demonstrator für Erklärbare KI im Controlling

## Docker Container
Dieses Projekt verwendet Docker und Docker Compose, um eine vollständige Anwendungsumgebung mit den folgenden Containern zu starten:

Frontend: Container für die Benutzeroberfläche.
Backend: Container, der Anfragen verarbeitet und mit der CouchDB-Datenbank kommuniziert.
CouchDB: Container für die CouchDB-Datenbank.
Nginx: Reverse-Proxy-Container für das Routing zwischen Frontend und Backend.

Starten der Container mit sudo docker-compose up <i>(läuft aber eig automatisch wenn man neue commits pushed)</i>
Um zu schauen, ob die Container laufen, kann man den Befehl sudo docker ps verwenden.


In der Datei daemon.json im Ordner /etc/docker/ ist definiert, welches Verzeichnis verwendet wird. 
```
{
  "data-root": "/media/xai-controlling-volume/docker-cache"
}
```
