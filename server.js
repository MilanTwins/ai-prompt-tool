const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web_ui')));

app.get('/api/formats', (req, res) => {
  const formatsDir = path.join(__dirname, 'config', 'formats');
  fs.readdir(formatsDir, (err, files) => {
    if (err) {
      console.error("Erreur lecture formats:", err);
      return res.status(500).json({ error: 'Cannot read formats directory' });
    }
    const formats = files
      .filter(f => f.endsWith('.xml'))
      .map(f => f.replace('.xml', ''));
    res.json(formats);
  });
});

app.get('/api/currentDir', (req, res) => {
  // Renvoie le répertoire actuel du projet
  const currentDir = process.cwd();
  res.json({ currentDir });
});

app.post('/api/updateSource', (req, res) => {
  const { source_directory } = req.body;
  const userConfigPath = path.join(__dirname, 'config', 'user_config.yaml');
  try {
    let yamlContent = fs.readFileSync(userConfigPath, 'utf-8');
    if (/source_directory:/.test(yamlContent)) {
      yamlContent = yamlContent.replace(/source_directory: ".*"/, `source_directory: "${source_directory}"`);
    } else {
      yamlContent = `source_directory: "${source_directory}"\n` + yamlContent;
    }
    fs.writeFileSync(userConfigPath, yamlContent, 'utf-8');
    res.json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update source directory' });
  }
});

app.post('/api/updateFinalRequest', (req, res) => {
  const { final_request } = req.body;
  const finalRequestPath = path.join(__dirname, 'config', 'final_request.yaml');
  try {
    const content = `final_request: "${final_request.replace(/"/g, '\\"')}"\n`;
    fs.writeFileSync(finalRequestPath, content, 'utf-8');
    res.json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update final_request.yaml' });
  }
});

app.post('/api/generate', (req, res) => {
  const { format } = req.body;
  const genStructureCmd = `python3 scripts/generate_structure.py`;
  exec(genStructureCmd, { cwd: __dirname }, (err) => {
    if (err) {
      console.error("Erreur génération structure:", err);
      return res.status(500).send('Error running generate_structure.py');
    }
    const genPromptCmd = `python3 scripts/generate_prompt.py ${format}`;
    exec(genPromptCmd, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error("Erreur génération prompt:", stderr);
        return res.status(500).send('Error generating prompt');
      }
      res.send(stdout);
    });
  });
});

app.post('/api/listDir', (req, res) => {
  const { dirPath } = req.body;
  fs.readdir(dirPath, { withFileTypes: true }, (err, entries) => {
    if(err) {
      console.error("Erreur listDir:", err);
      return res.status(500).json({ error: 'Cannot read directory' });
    }
    const dirs = [];
    const files = [];
    entries.forEach(entry => {
      if(entry.isDirectory()) dirs.push(entry.name);
      else files.push(entry.name);
    });
    res.json({
      dirPath,
      dirs,
      files
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
