const fs = require("fs");
const { execSync } = require('child_process');

const commitMessage = "Update catalog.json";

const ruleIdsWithHtml = [
  'aria-allowed-attr',
  'aria-hidden-focus',
  'aria-input-field-name',
  'aria-required-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-toggle-field-name',
  'aria-valid-attr-value',
  'aria-valid-attr',
  'input-button-name',
  'link-name',
  'nested-interactive',
  'avoid-inline-spacing',
  'aria-allowed-role'
];



const run = async () => {
  const outputJson = {};

  // Look through each item in the array
  // open the respective file as per ruleId
  // read the file's contents
  // retrieve the keys of the object
  ruleIdsWithHtml.forEach((ruleId) => {
    let file = null;
  
    // Check if the file exists
    if (fs.existsSync(`${__dirname}/results/${ruleId}.json`, "utf8")) {
      file = fs.readFileSync(`${__dirname}/results/${ruleId}.json`, "utf8");
    }
  
    // If the file exists, parse the contents
    if (file) {
      const data = JSON.parse(file);
      const keys = Object.keys(data);
      keys.forEach((key) => {
        if (!outputJson[ruleId]) {
          outputJson[ruleId] = [];
        } 
        outputJson[ruleId].push(key);
      });
    } else {
      outputJson[ruleId] = [];
    }
    console.log(outputJson);
  });
  
  outputJson["lastUpdated"] = new Date().toLocaleString();
  
  fs.writeFileSync("catalog.json", JSON.stringify(outputJson, null, 2));
  
  execSync(`git pull && git add catalog.json && git commit -m "${commitMessage}"`) 
  execSync(`git push`)
}

run();