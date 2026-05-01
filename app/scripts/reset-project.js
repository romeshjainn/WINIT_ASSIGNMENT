#!/usr/bin/env node

/**
 * Reset the project to a blank state.
 * Moves or deletes the starter directories under /src, then creates a new /src/app.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const srcDir = 'src';
const oldDirs = ['app', 'components', 'hooks', 'constants'];
const exampleDir = 'app-example';
const srcDirPath = path.join(root, srcDir);
const exampleDirPath = path.join(root, exampleDir);
const newAppDirPath = path.join(srcDirPath, 'app');

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";
import "../../global.css";

export default function RootLayout() {
  return <Stack />;
}
`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const moveDirectories = async (userInput) => {
  try {
    if (userInput === 'y') {
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`Created /${exampleDir}.`);
    }

    for (const dir of oldDirs) {
      const oldDirPath = path.join(srcDirPath, dir);

      if (!fs.existsSync(oldDirPath)) {
        console.log(`/${srcDir}/${dir} does not exist, skipping.`);
        continue;
      }

      if (userInput === 'y') {
        const newDirPath = path.join(exampleDirPath, srcDir, dir);
        await fs.promises.mkdir(path.dirname(newDirPath), { recursive: true });
        await fs.promises.rename(oldDirPath, newDirPath);
        console.log(`Moved /${srcDir}/${dir} to /${exampleDir}/${srcDir}/${dir}.`);
      } else {
        await fs.promises.rm(oldDirPath, { recursive: true, force: true });
        console.log(`Deleted /${srcDir}/${dir}.`);
      }
    }

    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log('\nCreated new /src/app directory.');

    await fs.promises.writeFile(path.join(newAppDirPath, 'index.tsx'), indexContent);
    console.log('Created src/app/index.tsx.');

    await fs.promises.writeFile(path.join(newAppDirPath, '_layout.tsx'), layoutContent);
    console.log('Created src/app/_layout.tsx.');

    console.log('\nProject reset complete. Next steps:');
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit src/app/index.tsx to edit the main screen.${
        userInput === 'y'
          ? `\n3. Delete the /${exampleDir} directory when you are done referencing it.`
          : ''
      }`
    );
  } catch (error) {
    console.error(`Error during script execution: ${error.message}`);
  }
};

rl.question(
  'Do you want to move existing files to /app-example instead of deleting them? (Y/n): ',
  (answer) => {
    const userInput = answer.trim().toLowerCase() || 'y';

    if (userInput === 'y' || userInput === 'n') {
      moveDirectories(userInput).finally(() => rl.close());
      return;
    }

    console.log("Invalid input. Please enter 'Y' or 'N'.");
    rl.close();
  }
);
