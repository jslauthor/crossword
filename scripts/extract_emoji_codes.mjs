import fs from 'fs/promises';
// import path from 'path';
import clipboardy from 'clipboardy';

const directoryPath = './public/noto/svg'; // Replace with your directory path
const maxUnicodeValues = 3; // Adjust this value as needed

async function extractEmojiCodes() {
  try {
    const files = await fs.readdir(directoryPath);

    const emojiCodes = files
      .filter((file) => file.startsWith('emoji_u') && file.endsWith('.svg'))
      .map((file) => {
        const match = file.match(/emoji_u(.+)\.svg/);
        return match ? `u${match[1]}` : null;
      })
      .filter((code) => code && code.split('_').length <= maxUnicodeValues);

    const jsonArray = JSON.stringify(emojiCodes, null, 2);
    await clipboardy.write(jsonArray);

    console.log(
      `Extracted ${emojiCodes.length} emoji codes and copied to clipboard.`,
    );
    console.log('First few codes:', emojiCodes.slice(0, 5));
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

extractEmojiCodes();
