const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'azkar_data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function cleanText(text) {
    if (!text) return text;

    // The text appears to be a stringified representation of a list or contains python-like list artifacts.
    // Example: "\\n', '\"TEXT\". [Ref].\\n', '\\n', ..."

    let cleaned = text;

    // 1. Remove the specific artifact patterns observed
    // We replace specific junk sequences with spaces
    cleaned = cleaned.replace(/\\n/g, ' ');
    cleaned = cleaned.replace(/', '/g, ' ');

    // 2. Remove leading/trailing formatting chars like ' or " or ,
    // It seems the content is often wrapped in quotes inside the string

    // Simple approach: Extract Arabic text and basic punctuation
    // Or just aggressively remove the known junk.

    // Remove the literal "\n" and "', '" sequences
    // Example input: "\n', '"text". [ref].\n', '\n'"

    // Let's try to strip the specific Python/JSON-dump artifacts
    cleaned = cleaned
        .replace(/\\n/g, ' ')       // Remove literal \n
        .replace(/'\s*,\s*'/g, ' ') // Remove ', '
        .replace(/^[\s',]+|[\s',]+$/g, '') // Remove leading/trailing quotes/commas
        .replace(/\s+/g, ' ')       // Collapse spaces
        .trim();

    return cleaned;
}

// Target specific categories that were messed up
const targetCategories = ['prophets_duaa', 'quranic_uaa'];

targetCategories.forEach(catId => {
    if (data[catId]) {
        console.log(`Cleaning ${catId}...`);
        data[catId].items.forEach(item => {
            const original = item.text;
            item.text = cleanText(item.text);
            // Log a sample to check
            if (original !== item.text && Math.random() < 0.1) {
                console.log(`Changed: ${original.substring(0, 30)}... -> ${item.text.substring(0, 30)}...`);
            }
        });
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
console.log('Done cleaning azkar_data.json');
