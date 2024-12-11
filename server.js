// server.js

const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml'); // Remplacer safeLoad par yaml.load

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web_ui')));

// Liste des formats disponibles
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

// Renvoie le répertoire actuel du projet
app.get('/api/currentDir', (req, res) => {
  const currentDir = process.cwd();
  res.json({ currentDir });
});

// Met à jour le répertoire source dans user_config.yaml
app.post('/api/updateSource', (req, res) => {
  const { source_directory } = req.body;
  const userConfigPath = path.join(__dirname, 'config', 'user_config.yaml');
  try {
    let yamlContent = fs.readFileSync(userConfigPath, 'utf-8');
    let doc = yaml.load(yamlContent) || {};
    doc.source_directory = source_directory; // Mise à jour directe de la propriété
    const newYaml = yaml.dump(doc);
    fs.writeFileSync(userConfigPath, newYaml, 'utf-8');
    res.json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update source directory' });
  }
});

// Met à jour la requête finale dans final_request.yaml
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

// Génère le prompt final
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

// Liste le contenu d'un répertoire
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

// Liste les templates disponibles dans config/templates/
app.get('/api/templates', (req, res) => {
  const templatesDir = path.join(__dirname, 'config', 'templates');
  fs.readdir(templatesDir, (err, files) => {
    if(err) {
      console.error("Erreur lecture templates:", err);
      return res.status(500).json({error:'cannot read templates'});
    }
    const tpl = files.filter(f => f.endsWith('.yaml'));
    res.json(tpl);
  });
});

// Liste les configs disponibles dans config/
app.get('/api/listConfigs', (req, res) => {
  const configDir = path.join(__dirname, 'config');
  fs.readdir(configDir, (err, files) => {
    if(err) {
      console.error("Erreur lecture config dir:", err);
      return res.status(500).json({error:'cannot read config dir'});
    }
    const configs = files.filter(f => f.endsWith('.yaml'));
    res.json({ configs });
  });
});

// Récupère le contenu d'un fichier de config
app.post('/api/getConfigContent', (req, res) => {
  const { name } = req.body;
  const filePath = path.join(__dirname, 'config', name);
  fs.readFile(filePath, 'utf-8', (err, content) => {
    if(err) {
      console.error("Erreur lecture config:", err);
      return res.status(500).send('Cannot read file');
    }
    res.send(content);
  });
});

// Crée une nouvelle config à partir d'un template
app.post('/api/createConfig', (req, res) => {
  const { template, name } = req.body;
  const templatePath = path.join(__dirname, 'config', 'templates', template);
  fs.readFile(templatePath, 'utf-8', (err, content) => {
    if(err) {
      console.error("Erreur lecture template:", err);
      return res.status(500).json({error:'cannot read template'});
    }
    const newPath = path.join(__dirname, 'config', name);
    fs.writeFile(newPath, content, 'utf-8', (e) => {
      if(e) {
        console.error("Erreur écriture config:", e);
        return res.status(500).json({error:'cannot write file'});
      }
      res.json({success:true});
    });
  });
});

// Récupère le contenu d'un template pour édition
app.post('/api/getTemplateContent', (req, res) => {
  const { template } = req.body;
  const templatePath = path.join(__dirname, 'config', 'templates', template);
  fs.readFile(templatePath, 'utf-8', (err, content) => {
    if(err) {
      console.error("Erreur lecture template:", err);
      return res.status(500).json({error:'cannot read template'});
    }
    res.send(content);
  });
});

// Créer un config personnalisé
app.post('/api/createCustomConfig', (req, res) => {
  const { name, configData } = req.body;
  try {
    const yamlStr = yaml.dump(configData);
    const newPath = path.join(__dirname, 'config', name);
    fs.writeFile(newPath, yamlStr, 'utf-8', (e) => {
      if(e) {
        console.error("Erreur écriture config personnalisée:", e);
        return res.status(500).json({error:'cannot write file'});
      }
      res.json({success:true});
    });
  } catch(e) {
    console.error("Erreur conversion YAML:", e);
    res.status(500).json({error:'Failed to create custom config'});
  }
});

// Met à jour la sélection des configs dans user_config.yaml
app.post('/api/updateSelectedConfigs', (req, res) => {
  const { project_data_file, user_config_file } = req.body;
  const userConfigPath = path.join(__dirname, 'config', 'user_config.yaml');

  try {
    let yamlContent = fs.readFileSync(userConfigPath, 'utf-8');
    const doc = yaml.load(yamlContent) || {};
    doc.selected_project_data = project_data_file;
    doc.selected_user_config = user_config_file;
    const newYaml = yaml.dump(doc);
    fs.writeFileSync(userConfigPath, newYaml, 'utf-8');

    res.json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update selected configs' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
