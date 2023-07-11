// const express = require("express");

// const app = express();
// // const port = process.env.SERVER_PORT || 8000;

// // Add Access Control Allow Origin headers
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

// app.listen(port, () => console.log(`Listening on port ${port}`));

console.log("retrieve catalog")

let data
const retrieveCatalogData = async () => {
    // fetch from github
    await fetch(
    //`https://raw.githubusercontent.com/greyguy21/purple-ai-test/main/results/aria-allowed-attr.json`,
    `https://raw.githubusercontent.com/greyguy21/purple-ai-test/main/catalog_test.json`,{
        headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    }  
    )
    .then(async response => {            
        console.log("Json string from AI")
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
}

