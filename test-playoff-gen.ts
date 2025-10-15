import { storage } from './server/storage';

async function testPlayoffGeneration() {
  try {
    console.log('Generating playoff bracket...');
    const games = await storage.generatePlayoffBracket(
      '2025-oba-provincials-13u-hs-championships-2025-10',
      '2025-oba-provincials-13u-hs-championships-2025-10_div_13U'
    );
    console.log(`Successfully generated ${games.length} playoff games`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testPlayoffGeneration();
