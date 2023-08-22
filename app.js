const express = require(`express`);
const jsdom = require('jsdom');
const app = express();
const { JSDOM } = jsdom;
app.use(express.static('public', {extensions: ['html']}));
app.use(express.json());
app.listen(80);

app.get("/getresults", (request, response) => {
    const barcodes = JSON.parse(request.query.barcodes);

    if (!barcodes) {
        response.sendStatus(400);
        return;
    }

    const requests = barcodes.map((barcode) => GetResult(barcode));

    Promise.all(requests).then((responses) => {
        var parsedResult = responses.map(response => parseResult(response));
        response.send(parsedResult);
    })
});

// Reads a result and extracts the Not Found Messaage or the Result Card info 
function parseResult(result) {
    let notRecievedNode = undefined;

    for (const node of dom.window.document.querySelectorAll('h4')) {
        if (node.textContent.includes("COVID-19 test not yet received or no matching records found.")) {
            notRecievedNode = node.parentNode;
        }
    }

    if (notRecievedNode) {
        return notRecievedNode.outerHTML;
    }

    const resultCardNode = dom.window.document.getElementById("result-card");

    if (resultCardNode) {
        return resultCardNode.outerHTML;
    }
    
    return `<div> Error getting result for. Try offical <a href="https://securelink.labmed.uw.edu/cascadia/"> result portal.</a></div>`
}

async function GetResult(barcode) {
        var result = await fetch("https://securelink.labmed.uw.edu/cascadia/result", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `barcode=${barcode[0]}&dob=${barcode[1]}`
        });
 
    return await result.text();
}
