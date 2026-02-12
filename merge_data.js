const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const azkarPath = path.join(__dirname, 'azkar.json');
const outputPath = path.join(__dirname, 'azkar_data.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const azkar = JSON.parse(fs.readFileSync(azkarPath, 'utf8'));

const unified = {};

// Process data.json (Morning/Evening)
const morningItems = data.filter(i => i.category === 'صباح').map(i => ({
    text: i.text,
    count: i.count,
    category: 'أذكار الصباح'
}));
const eveningItems = data.filter(i => i.category === 'مساء').map(i => ({
    text: i.text,
    count: i.count,
    category: 'أذكار المساء'
}));

unified['morning'] = {
    id: 'morning',
    title: 'أذكار الصباح',
    items: morningItems
};

unified['evening'] = {
    id: 'evening',
    title: 'أذكار المساء',
    items: eveningItems
};

// Process azkar.json
const categoryMap = {
    "أذكار بعد السلام من الصلاة المفروضة": "post_prayer",
    "تسابيح": "tasabeeh",
    "أذكار النوم": "sleep",
    "أذكار الاستيقاظ": "wake_up",
    "أدعية قرآنية": "quranic_uaa",
    "أدعية الأنبياء": "prophets_duaa"
};

for (const [key, items] of Object.entries(azkar)) {
    const id = categoryMap[key] || key;
    unified[id] = {
        id: id,
        title: key,
        items: items.map(i => ({
            text: i.content,
            count: parseInt(i.count),
            category: key,
            original_desc: i.description
        }))
    };
}

fs.writeFileSync(outputPath, JSON.stringify(unified, null, 4), 'utf8');
console.log('Unified data written to azkar_data.json');
