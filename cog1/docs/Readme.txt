
Software Template

Das Template ist in JavaScript unter Verwendung des Dojo Frameworks geschrieben.
Sie können es in einem Bowser lokal (file:///...) oder über eine Webserver (Apache,etc.)
aufrufen.

Das ZIP-Archiv benötigt 3 kurze Schritte um lauffähig zu sein: 
 
1. Unzip Template-Archiv in einen beliebigen Ordner 
Struktur sollte so aussehen:
[beliebiger Pfad]/cog1
[beliebiger Pfad]/cog1/ext
[beliebiger Pfad]/cog1/modelData
[beliebiger Pfad]/css
[beliebiger Pfad]/docs
[beliebiger Pfad]/index.html 
Dazu kommt Dojo (http://dojotoolkit.org/download/), wenn sie eine lokale Kopie vorhalten wollen:
[beliebiger Pfad]/dojo-release-1.7.2  (oder neuere Version)

2. Für eine Installation ohne Webserver Dojo Framework für Javascript herunterladen 
und in den gleichen Ordner entpacken.
Oder alternativ dojo dirkt von Server laden (dann muss immer eine Internet-Verbindung bestehen):
<script src="http://ajax.googleapis.com/ajax/libs/dojo/1.7.2/dojo/dojo.js" data-dojo-config="async: true"></script>
In der Index Datei müssen die Pfade zu Dojo "<script src=..." entsprechend anpassen.
 
3. In der start.js den Pfad zum "cog1" Ordner für eine Installation ohne Webserver absolut angeben
(unter Windows "cog1" : "file://[Laufwerk]:/[der gleiche Pfad wie oben]/cog1").
Für eine Installation mit (lokalem) Webserver, wird der relative Pfad zum Document-Root des Servers angegeben.

Zum Starten in einem Browser der Wahl laden.

 
Aufgaben

Suchen Sie im Template nach dem Stichwort "START exercise", um die Einstiegspunkte für Ihre Aufgaben zu finden.
Für manche Aufgaben gibt es mehre zu modifizierende Stellen in Code, sie werden also mehrere Einstiegspunkte finden.

Die Programmieraufgaben zum Template finden Sie in den jeweiligen Arbeitsblöcken.


Arbeitsumgebung und Workflow

Arbeiten Sie mit Eclipse mit Aptana Plugin und Fireforx mit Firebug
oder Chrome mit den Entwicker Tools. Achten Sie bei der Formatierung 
auf die Vorgaben von JS-Lint. Dazu gibt es ein Eclipse-Plugin.

Beim Debuggen müssen Sie zunächte einen Breakpoint in die Datei start.js
setzen, weil Sie als einzige direkt geladen wird. Erst nach dem erreichen 
dieses Breakpoints haben Sie im Browser Zugang zu den anderen JS Dateien.
Alternativ nutzen Sie das "debugger;" statement im source code.

