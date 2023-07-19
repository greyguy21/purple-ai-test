const fs = require('fs');
const { execSync } = require('child_process');

const omittedRules = [
    'html-xml-lang-mismatch', 
    'frame-tested', 
    'color-contrast', 
    'link-in-text-block', 
    'page-has-heading-one',
    'duplicate-id-aria', 
    'frame-title-unique', 
    'frame-title', 
    'html-has-lang', 
    'html-lang-valid', 
    'input-image-alt', 
    'link-in-text-block', 
    'list', 
    'listitem', 
    'marquee', 
    'valid-lang', 
    'video-caption', 
    'accesskeys', 
    'empty-heading', 
    'empty-table-header', 
    'label-title-only'
];
const deprecatedRules = ['aria-roledescription', 'audio-caption', 'duplicate-id-active', 'duplicate-id'];
const rulesUsingRoles = ['aria-allowed-attr', 'aria-required-attr', 'aria-required-children', 'aria-required-parent', 'aria-roles', 'aria-allowed-role']; 

const htmlTagAndAttributeRegex = new RegExp(/((?<=[<])\s*([a-zA-Z][^\s>/]*)\b)|([\w-]+)\s*(?==\s*["']([^"']*)["'])/g);
const createBasicHTMLLabel = (ruleID, html) => {
    if (rulesUsingRoles.includes(ruleID) & html.includes('role')) {
        const label = createLabelForRuleWithRole(html);
        return label;
    }
    const label = html.match(htmlTagAndAttributeRegex).toString().replaceAll(",", "_");
    return label;
}; 

const createLabelForRuleWithRole = (html) => {
    const htmlTagAndRoleAttributeRegex = new RegExp(/(?<=<)\s*([a-zA-Z][^\s>/]*\b)|role="([^"]*)"/g); 
    const htmlLabel = html.match(htmlTagAndRoleAttributeRegex).toString().replaceAll(',', '_');
    console.log(htmlLabel);

    return htmlLabel ? htmlLabel : "";
}

const processHTMLSnippet = (html) => {
    const processed = html.replace(htmlTagAndAttributeRegex, `\`$&\``);
    return processed;
};

const updateRowRange = async (rows, range) => {
    if (rows.length <= range.limit && rows.length > 0) {
        range.offset += rows.length;
       fs.writeFileSync('./range.json', JSON.stringify(range));
    }
};

const getResults = async (ruleID) => {
    const resultPath = `./results/${ruleID}.json`; 
    let data;
    if (!fs.existsSync(resultPath)) {
        data = null;
    } else {
        data = JSON.parse(fs.readFileSync(resultPath))
    }
    return data;
};

const needsQuery = async (ruleID) => {
    const data = await getResults(ruleID);
    return !data;
};

const needsQueryForHTML = async (ruleID, html, label) => {
    const data = await getResults(ruleID);
    
    if (!data) {
        return true; 
    }

    const htmlArr = html.match(htmlTagAndAttributeRegex);
    if (data[label]) {
        return false; 
    }

    // let query = {currentCount: 0, key: null}; 
    let currentCount = 0;
    for (const key of Object.keys(data)) {
        const keyArr = key.split('_'); 
        const count = keyArr.reduce((count, curr, index) => {
            if (curr === htmlArr[index]) {
                return count + 1; 
            }
            return count;
        }, 0)
        
        if (count >= 3 && count > currentCount) {
            currentCount = count; 
        }
    } 
    return currentCount === 0;
};

module.exports = {
    omittedRules, 
    deprecatedRules, 
    createBasicHTMLLabel, 
    processHTMLSnippet, 
    updateRowRange,
    getResults, 
    needsQuery,
    needsQueryForHTML
}