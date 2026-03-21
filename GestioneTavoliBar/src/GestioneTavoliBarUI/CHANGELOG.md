Questo file spiega in che modo Visual Studio ha creato il progetto.

Per generare questo progetto sono stati usati gli strumenti seguenti:
- Angular CLI (ng)

Per generare questo progetto sono stati eseguiti i passaggi seguenti:
- Creare un progetto Angular con ng: `ng new GestioneTavoliBarUI --defaults --skip-install --skip-git --no-standalone `.
- Aggiornare angular.json con la porta.
- Creare il file di progetto (`GestioneTavoliBarUI.esproj`).
- Creare `launch.json` per abilitare il debug.
- Aggiornare package.json per aggiungere `jest-editor-support`.
- Aggiornare lo script `start` in `package.json` per specificare l'host.
- Aggiungere `karma.conf.js` per i test di unità.
- Aggiornare `angular.json` in modo che punti a `karma.conf.js`.
- Aggiungi progetto alla soluzione.
- Scrivere questo file.
