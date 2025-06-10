//To run, change enter your username on line 15, and enter "node scraper.js" in the terminal

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

let percentages = new Map();
let repos = [];

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function scrapeFirstSite() {
    //enter your GitHub account name where it says 'AccountName'
    const url = 'https://github.com/AccountName?tab=repositories';

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the page and wait for the network to be idle
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Add a delay to ensure the page fully loads
    await delay(3000);

    // Extract HTML content after JavaScript execution
    const content = await page.content();

    // Load the content into Cheerio
    const $ = cheerio.load(content);

    // Select all code repository links
    const repoLinks = $("#user-repositories-list *[itemprop='name codeRepository']"); 

    // Extract and store the results
    repoLinks.each((index, element) => {
        repos.push("https://github.com"+$(element).attr('href'));
    });

    // Close Puppeteer
    await browser.close();
}

async function scrapeSecondSite(project) {
    
    const url = project;

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the page and wait for the network to be idle
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract HTML content after JavaScript execution
    const content = await page.content();

    // Load the content into Cheerio
    const $ = cheerio.load(content);

    // Select all spans inside a link with the class 'd-inline-flex'
    let languages = $('a.d-inline-flex span');
    languages.slice(1);
    //Put the cheerio object into an array
    let languagesArray = [];
    languages.each((index, language) => {
        languagesArray.push(language.children[0].data);
    });
    // Add the percentages into the hashmap
    for(let i = 0; i < languagesArray.length; i+=2) {
        if(!percentages.has(languagesArray[i])) {
            percentages.set(languagesArray[i], languagesArray[i+1]);
        }
        else {
            percentages.set(languagesArray[i], parseFloat(percentages.get(languagesArray[i]).split("%")[0]) + parseFloat(languagesArray[i+1].split("%")[0]) + "%");
        }
    }

    // Close Puppeteer
    await browser.close();
}

(async () => {
    await scrapeFirstSite(); // Wait for the first function to complete
    if(repos.length === 0) {
        console.log("No repositories found. Please check your GitHub username.");
        return;
    }
    for (const repo of repos) { // Use a for...of loop to ensure sequential execution
        console.log(`Processing repo: ` + (parseFloat(repos.indexOf(repo))+1)); // Log the current repo being processed
        await scrapeSecondSite(repo); // Execute the second function for each repo
    }

    //Divide each by number of repos so percentages add up to 100%
    percentages.forEach((percentage, language) => {
        percentages.set(language, Math.round(parseFloat(percentage.split("%")[0])/repos.length*100)/100 + "%");
    });

   // Sort entries by value descending
    const sortedMap = new Map(
        [...percentages.entries()].sort((a, b) =>
            parseFloat(b[1]) - parseFloat(a[1])
        )
    );
    //print out results
    console.log("")
    console.log("Sorted percentages:");
    for (const [language, percentage] of sortedMap) {
        console.log(`${language}: ${percentage}`);
    }
})();