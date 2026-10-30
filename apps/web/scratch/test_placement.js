const sharp = require('sharp');
const path = require('path');

async function testPlacement() {
  const bgPath = 'public/assets/tavern_bg.jpg';
  const charDir = 'public/assets/characters';
  
  // Characters to place:
  // 1. Cowboy on the left (seated around x=160, y=280)
  // 2. Plague Doctor (seated around x=420, y=260)
  // 3. Dog Gentleman (seated around x=760, y=260)
  // 4. Werewolf (standing behind / middle around x=920, y=200)
  // 5. Girl (seated on the right around x=1020, y=290)

  const cowboy = await sharp(path.join(charDir, 'cowboy_idle.png')).resize({ width: 340 }).toBuffer();
  const plague = await sharp(path.join(charDir, 'plague_idle.png')).resize({ width: 310 }).toBuffer();
  const dog = await sharp(path.join(charDir, 'dog_idle.png')).resize({ width: 300 }).toBuffer();
  const wolf = await sharp(path.join(charDir, 'wolf_idle.png')).resize({ width: 330 }).toBuffer();
  const girl = await sharp(path.join(charDir, 'girl_idle.png')).resize({ width: 280 }).toBuffer();

  const preview = await sharp(bgPath)
    .composite([
      { input: cowboy, left: 80, top: 270 },
      { input: plague, left: 360, top: 250 },
      { input: dog, left: 690, top: 250 },
      { input: wolf, left: 910, top: 210 },
      { input: girl, left: 1040, top: 290 },
    ])
    .jpeg({ quality: 85 })
    .toFile('C:/Users/Administrator/.gemini/antigravity-ide/brain/603c5b93-52cc-4ee0-a146-6a49c25eab95/scratch/table_preview.jpg');

  console.log('Preview saved successfully!');
}

testPlacement().catch(console.error);
