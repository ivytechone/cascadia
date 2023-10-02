const express = require(`express`);
const jsdom = require('jsdom');
const app = express();
const { JSDOM } = jsdom;
//const pinoElastic = require('pino-elasticsearch')
//const pino = require('pino')
app.use(express.static('public', {extensions: ['html']}));
app.use(express.json());

/*const streamToElastic = pinoElastic({
    index: 'cascadiaresults',
    node: 'http://localhost:9200',
    esVersion: 8,
    flushBytes: 1000,
});

const log = pino({level:'info'}, streamToElastic);
log.info("appstart");
*/
app.listen(8000);

app.get("/cascadiaresults", (request, response) => {
    let barcodes = undefined;
    try {
        barcodes = JSON.parse(request.query.barcodes);
    } catch (x) {}

    if (!barcodes) {
        response.status(400).send("Bad Request");
        //log.warn("badrequest")
        return;
    }

    const dom = new JSDOM(`<!DOCTYPE html><head><meta name="description" content=""><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><link rel="stylesheet" href="/normalize.css"><link rel="stylesheet" href="/main.css"><link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet"><script src="/modernizr-3.8.0.min.js"></script><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous"><meta name="theme-color" content="#fafafa"></head><body><div class="row justify-content-md-center mt-5"><div class="container" id="resultscontainer"></div>`);

    const requests = barcodes.map((barcode) => GetResult(barcode));

    Promise.all(requests).then((responses) => {
        var parsedResults = responses.map(response => parseResult(response));
        parsedResults.forEach(x => {
            const resultDiv = dom.window.document.createElement("div");
            resultDiv.innerHTML = x;
            dom.window.document.getElementById("resultscontainer").appendChild(resultDiv);
        })
        //log.info("getresults");
        response.send(dom.window.document.documentElement.outerHTML);
    });
});

// Reads a result and extracts the Not Found Messaage or the Result Card info 
function parseResult(result) {
    const dom = new JSDOM(result);
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
