const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

let username;
let password;

// Function to save data to a JSON file
const saveToFile = (data, filePath) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Function to read data from a JSON file
const readFromFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData);
    }
    return [];
};

// Function to compare two arrays and find differences
const findDifferences = (oldData, newData) => {
    const oldSet = new Set(oldData);
    const differences = newData.filter(item => !oldSet.has(item));
    return differences;
};

const askForCredentials = (query) =>
{
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
const user_path = path.join(__dirname, 'user.json');

const giris = async () => {
    const username = await askForCredentials('edestek kullanıcı adın(okulnumaran):');
    const password = await askForCredentials('şifren: ');

    const userData = { username, password };
    
    // Save the credentials to the JSON file
    saveToFile(userData, user_path);

    return userData;
}

const scrape = async () =>
{
    if (fs.existsSync(user_path))
    {
        const rawData = fs.readFileSync(user_path, 'utf-8');
        const credentials = JSON.parse(rawData);
        
        username = credentials.username;
        password = credentials.password;
    }

    else
    {
        console.log("kayıtlı kullanıcı bulunuadı lütfen bilgilerinizi kaydedin");
        user_temp =  await giris();
        username=user_temp.username;
        password=user_temp.password;
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--lang=tr-TR']});
    const page = await browser.newPage();

    page.setDefaultTimeout(300000);
  
    await page.goto('https://mf.kocaeli.edu.tr/duyurular#');

    await page.waitForSelector('.announcements-list');
    
    const muh_temp = await page.evaluate(() => {

        const duyurular = document.querySelectorAll('.announcements-list');
        
        const basliklar = [];

        duyurular.forEach(element => {


            const baslik = element.querySelector('h3');

            if (baslik) 
            { 
                basliklar.push(baslik.textContent.trim());
            }

        });

        return basliklar;

    });

    //console.log(muh_temp);

    //console.log("------------------------------------------------------------------------------------------------------------------------")

    await page.goto('https://seng.kocaeli.edu.tr/duyurular#');

    await page.waitForSelector('.announcements-list');

    const yaz_temp = await page.evaluate(() => {

        const duyurular = document.querySelectorAll('.announcements-list');
        
        const basliklar = [];

        duyurular.forEach(element => {


            const baslik = element.querySelector('h3');

            if (baslik) 
            { 
                basliklar.push(baslik.textContent.trim());
            }

        });

        return basliklar;

    });

    //console.log(yaz_temp);

    //console.log("------------------------------------------------------------------------------------------------------------------------")

    await page.goto('https://edestek2.kocaeli.edu.tr/login/');

    //await page.locator('#modalpencere1sagustdugme').click();

    await page.locator('#username').fill(username);

    await page.locator('#password').fill(password);
    
    await page.locator('#loginbtn').click();

    await page.waitForSelector('.dashboard-card');
    
    const percents = await page.evaluate(()=>{

        const yuzdelik = document.querySelectorAll('.dashboard-card')

        const dondu = [];

        yuzdelik.forEach(element => {

            const ders_adi = element.querySelector('.multiline').textContent.trim();

            const yuzde = element.querySelectorAll('.progress-text span');

            if (yuzde)
            {
                for (const span of yuzde) {
                    if (!span.classList.length)
                    {
                        dondu.push(ders_adi + ": %" + span.textContent.trim());
                        break;
                    }
                }
            }
        })

        return dondu;
    })
    
    //console.log(percents);

    //console.log("------------------------------------------------------------------------------------------------------------------------")

    const muh_filePath = path.join(__dirname, 'muh.json');

    // Read existing data from the JSON file
    const muh_oldData = readFromFile(muh_filePath);

    // Compare old data with new data and find differences
    const muh_differences = findDifferences(muh_oldData, muh_temp);

    console.log("mühendislik fakülte duyurusu değişikleri:")
    if (muh_differences.length > 0)
    {
        console.log(muh_differences);
    } 

    else
    {
        console.log('Değişiklik bulunamadı!');
    }

    saveToFile(muh_temp, muh_filePath);

    console.log("---------------------------------------------------------------------------------------------------------------------------")

    const yaz_filePath = path.join(__dirname, 'yaz.json');

    // Read existing data from the JSON file
    const yaz_oldData = readFromFile(yaz_filePath);

    // Compare old data with new data and find differences
    const yaz_differences = findDifferences(yaz_oldData, yaz_temp);

    console.log("yazılım fakülte duyurusu değişikleri:")
    if (yaz_differences.length > 0)
    {
        console.log(yaz_differences);
    } 

    else
    {
        console.log('Değişiklik bulunamadı!');
    }

    saveToFile(yaz_temp, yaz_filePath);

    console.log("-----------------------------------------------------------------------------------------------------------------------------")

    const edestek2_filePath = path.join(__dirname, 'edestek2.json');

    console.log("edestek2 durumu:")
    if (percents.length > 0)
    {
        console.log(percents);
    } 

    else
    {
        console.log('Girdisi olan ders bulunamadı!');
    }

    saveToFile(percents, edestek2_filePath);

    console.log("-----------------------------------------------------------------------------------------------------------------------------")

    await browser.close();
}

scrape();


