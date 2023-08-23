const express = require("express");
const ejs = require("ejs");
const path = require("path");
sw = require('stopword');
const fs = require("fs");

const readFileLines = filename =>
   fs.readFileSync(filename)
   .toString('UTF8')
   .split('\n');

// Calling the readFiles function with file name
const wordlist = readFileLines('./text/wordlist.txt');
const IDF1 = readFileLines('./text/IDF.txt');
const IDTF1 = readFileLines('./text/IDTF.txt');
const urls = readFileLines('./text/Codeforces_dp_urls.txt');
const titles = readFileLines('./text/Codeforces_dp_Titles.txt');
const w = wordlist[0];
const ii = IDF1[0];
const words = w.split(' ');
const IDF11 = ii.split(' ');
const IDF = [];
const len = words.length;

const IDTF = new Array(891);
for(i=0; i<891; i++){
    IDTF[i] = new Array(len);
}

for(i=0; i<891; i++){
    let iii = IDTF1[i];
    let iii1 = iii.split(' ');

    for(j=0; j<len; j++){
        IDTF[i][j] = parseFloat(iii1[j]);
    }
}

for(i=0; i<len; i++){
    IDF.push(parseFloat(IDF11[i]));
}

const app = express();
const PORT = process.env.port || 3000;

app.use(express.json());

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/search", (req, res) => {
    const query = req.query;

    let question = query.question;
    question = question.toLowerCase();

    let oldString = question.split(' ');
    let newString = sw.removeStopwords(oldString);
    let qlen = newString.length;
    
    let tfquery = new Array(len).fill(0);

    for(i=0; i<qlen; i++){
        if(words.findIndex(x1 => x1 == newString[i]) != -1){
            let pp = words.findIndex(x1 => x1 == newString[i]);
            tfquery[pp] += 1/qlen;
        }
    }

    let v1_sq_sum = 0;
    for(i=0; i<len; i++){
        tfquery[i] *= (IDF[i] || 0);
        v1_sq_sum += (tfquery[i]*tfquery[i] || 0);
    } 
    
    let sim_array = [];
    
    let result = []
    if(v1_sq_sum == 0){
        //result.push("No match found");
        for(i=0; i<5; i++){
            result.push({
                title : "NA",
                url : "NA",
            },
            )
            //result.push(urls[sim_array[i][1]-1]);
        }
    }
    else{
        for(i=0; i<891; i++){
            let v2_sq_sum=0;
            let dot_prod = 0;
            for(j=0; j<len; j++){
                v2_sq_sum += ((IDTF[i][j]*IDTF[i][j]) || 0);
                dot_prod += ((tfquery[j]*IDTF[i][j]) || 0);
            }
            if(v2_sq_sum == 0){
                continue;
            }
            
            let sim = dot_prod / Math.sqrt(v1_sq_sum * v2_sq_sum)
            sim_array.push([sim, i+1]);
        }

        sim_array.sort();
        sim_array.reverse();
        for(i=0; i<5; i++){
            result.push({
                title : titles[sim_array[i][1]-1],
                url : urls[sim_array[i][1]-1],
            },
            )
            //result.push(urls[sim_array[i][1]-1]);
        }
    }
    
    setTimeout(() => {
        res.json(result);
    }, 3000);    
 
});

app.listen(3000, () => {
    console.log("Server is running on port "+ PORT);
});

