const fs = require('fs');
const { execSync } = require('child_process');

const omittedRules = ['html-xml-lang-mismatch', 'frame-tested', 'color-contrast', 'link-in-text-block', 'page-has-heading-one'];
const deprecatedRules = ['aria-roledescription', 'audio-caption', 'duplicate-id-active', 'duplicate-id'];

const htmlTagAndAttributeRegex = new RegExp(/((?<=[<])\s*([a-zA-Z][^\s>/]*)\b)|([\w-]+)\s*(?==\s*["']([^"']*)["'])/g);
const createBasicHTMLLabel = (ruleID, html) => {
    if (ruleID === "aria-valid-attr-value") {
        const label = createLabelForAriaValidAttrValue(html);
        return label;
    }
    const label = html.match(htmlTagAndAttributeRegex).toString().replaceAll(",", "_");
    return label;
}; 

const createLabelForAriaValidAttrValue = (html) => {
    const ariaValidAttrValueHtml = html.replace(/^<|>$/g, "")
    const ariaValidAttrValueHtmlList = ariaValidAttrValueHtml.split(' ');
    const roleForHtml = ariaValidAttrValueHtmlList.find(item => /^role="\w+"/.test(item))
    htmlLabel = `${ariaValidAttrValueHtmlList[0]}_${roleForHtml}`
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