const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { config } = require("dotenv");
const fs = require('fs');
// const GitHub = require('github-api');
const axios = require('axios');
const prettier = require('prettier');
const utils = require('./utils');
const { execSync } = require('child_process');

const range = require('../range.json'); 
const prompts = require('../purpleAIPrompts.json');

config(); 

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY, 
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
    ]
})

// const github = new GitHub({
//     token: process.env.GITHUB_TOKEN
// });
// const repo = github.getRepo('greyguy21', 'purple-ai-test');

const HEADERS = {
    "Content-Type": "application/json",
    "Authorization": process.env.OPENAI_API_KEY
}

const query = async (payload) => {
    try {
      const response = await axios.post(process.env.OPENAI_API_ENDPOINT, payload, { headers: HEADERS });
      return { status: response.status, answer: response.data.data[0].llm_response.content };
    } catch (error) {
      console.error("Error in prompt: ", error.response);
    //   silentLogger.error(error);
      return { status: error.response.status }
    }
}

const getDataFromGoogleSheets = async () => {
    const sheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await sheet.loadInfo();
    console.log(sheet.title);

    const formReponses = sheet.sheetsByIndex[0];
    const rows = await formReponses.getRows({offset: range.offset, limit: range.limit}); // can set offset and limit
    // const rows = await formReponses.getRows();
    return rows; 
}

const generateIssuesToQuery = async (data) => {
    var issues = [];
    for (const d of data) {
        const results = JSON.parse(d.get('Accessibility Scan Results'));
        const website = d.get('Website URL');
        console.log(website)
        for (const ruleID of Object.keys(results)) {
            if (utils.omittedRules.includes(ruleID) || utils.deprecatedRules.includes(ruleID)) {
                continue;
            }
            console.log(ruleID)
            if (prompts[ruleID].needsHtml) {
                const snippets = results[ruleID].snippets; 
                for (const snippet of snippets) {
                    const basicHTMLLabel = utils.createBasicHTMLLabel(snippet);
                    if (await utils.needsQueryForHTML(ruleID, snippet, basicHTMLLabel)) {
                        const promptHTMLSnippet = utils.processHTMLSnippet(snippet);
                        issues.push({
                            issueID: ruleID, 
                            htmlSnippet: snippet,
                            basicHTMLLabel: basicHTMLLabel,
                            promptHTMLSnippet: promptHTMLSnippet
                        })
                    }
                }            
            } else {
                if (await utils.needsQuery(ruleID)) {
                    issues.push({issueID: ruleID});
                }
            }
        }
    }
    utils.updateRowRange(data, range);
    console.log(issues);
    return issues; 
}

const generateAIResponses = async (issues) => {
    const updatedIssues = new Set();
    for (const i of issues) {
        console.log(i.issueID);
        let prompt;
        if (prompts[i.issueID].needsHtml) {
            if (await utils.needsQueryForHTML(i.issueID, i.htmlSnippet, i.basicHTMLLabel)) {
                const htmlSnippet = i.promptHTMLSnippet;
                prompt = eval('`' + prompts[i.issueID].prompt + '`');
            } else {
                continue;
            }
        } else {
            prompt = prompts[i.issueID].prompt;
        }
        
        console.log(prompt);

        const result = await query({
            "flow_id": process.env.OPENAI_FLOW_ID, 
            "inputs": [{
                "prompt": prompt
            }]
        })
        console.log(result)
        const answer = result.status === 200 ? result.answer : null;
        if (answer) {
            const resultPath = `./results/${i.issueID}.json`; 
            var data = {}; 
            if (fs.existsSync(resultPath)) {
                data = JSON.parse(fs.readFileSync(resultPath));
            }

            const label = prompts[i.issueID].needsHtml ? i.basicHTMLLabel : i.issueID;
            console.log(label);
            data[label] = answer; 
            fs.writeFileSync(resultPath, prettier.format(JSON.stringify(data), {parser: "json"}));
            updatedIssues.add(i.issueID)
        }
    }
    return updatedIssues;
}

const writeResultsToGithub = async (updatedIssues) => {
    if (updatedIssues.size > 0) {
        let commitMessage = 'Add '; 
        for (const issue of updatedIssues) {
            commitMessage += `${issue}.json `; 
        }
        console.log(commitMessage);
        execSync(`git pull && git add results && git commit -m "${commitMessage}"`)  
    }
    execSync(`git pull && git add range.json && git commit -m "Update range.json"`)
    execSync(`git push`)
 }

const run = async () => {
    if (!fs.existsSync('../results')) {
        fs.mkdirSync('../results');
    }
    
    const data = await getDataFromGoogleSheets(); 
    const issues = await generateIssuesToQuery(data);
    const updatedIssues = await generateAIResponses(issues);
    await writeResultsToGithub(updatedIssues)
}

run();
