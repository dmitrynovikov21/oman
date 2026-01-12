const fs = require('fs');
const { PDFParse } = require("pdf-parse");

async function test() {
    const testFiles = fs.readdirSync('public/uploads').flatMap(dir => {
        const path = `public/uploads/${dir}`;
        if (fs.statSync(path).isDirectory()) {
            return fs.readdirSync(path).filter(f => f.endsWith('.pdf')).map(f => `${path}/${f}`);
        }
        return [];
    });

    if (testFiles.length === 0) {
        console.log("No PDF files found in uploads");
        return;
    }

    const filePath = testFiles[0];
    console.log("Testing with:", filePath);

    const buffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    try {
        const parser = new PDFParse(uint8Array);
        await parser.load();
        console.log("Loaded successfully!");

        // Check what getText returns
        const textResult = await parser.getText();
        console.log("getText result type:", typeof textResult);
        console.log("getText result:", textResult);

        // Maybe it returns an object with pages?
        if (textResult && typeof textResult === 'object') {
            console.log("Object keys:", Object.keys(textResult));
        }

        // Try getting text per page
        const info = await parser.getInfo();
        console.log("Info:", JSON.stringify(info, null, 2));

        // Try getPageText
        if (typeof parser.getPageText === 'function') {
            const page1Text = await parser.getPageText(0);
            console.log("Page 1 text type:", typeof page1Text);
            console.log("Page 1 text:", page1Text);
        }

    } catch (e) {
        console.error("Error:", e.message, e.stack);
    }
}

test();
