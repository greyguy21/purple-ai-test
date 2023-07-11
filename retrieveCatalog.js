let data
// fetch from github
await fetch(
//`https://raw.githubusercontent.com/greyguy21/purple-ai-test/main/results/aria-allowed-attr.json`,
`https://raw.githubusercontent.com/greyguy21/purple-ai-test/main/catalog_test.json`,
)
.then(async response => {
    if (response.status === 404) {
        console.log("Error getting catalog data")
    }

    if (response.status === 200) {
        console.log("Catalog response OK")
        const catalogData = await response.json();
        var jsonString = JSON.stringify(catalogData);
        return jsonString
    //   fs.writeFileSync(resultPath, JSON.stringify(data));
    }
})
