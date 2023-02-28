import fs from "fs";
import readline from "readline";
import { CloudlayerApiClient } from "../src/apiClient";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, ".", ".env") });

const apiKey = process.env.API_KEY!;
console.log("KEY", apiKey);
const client = new CloudlayerApiClient(apiKey, "http://localhost:3000/v2");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function runHtmlToPdfTest() {
  const response = await client.templateToPdf("u-test2", { test: "bob" });
  const asset = await response.getAsset();
  
  fs.writeFileSync("output.pdf", asset);
  console.log("PDF saved to output.pdf");
}

// async function runUrlToImageTest() {
//   try {
//     const url = await ask("Enter the URL to convert to an image: ");
//     const response = await client.urlToImage(url);

//     if (response.assetURL) {
//       const asset = await response.getAsset();
//       fs.writeFileSync("output.png", asset);
//       console.log("Image saved to output.png");
//     } else {
//       console.log("Conversion failed with error:", response.errorMessage);
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//   }
// }

async function main() {
  while (true) {
    console.log("\nMenu:");
    console.log("1. Convert HTML to PDF");
    console.log("2. Convert URL to image");
    console.log("3. Exit");

    const choice = await ask("Enter your choice: ");

    switch (choice) {
      case "1":
        await runHtmlToPdfTest();
        break;
      //   case "2":
      //     await runUrlToImageTest();
      //     break;
      case "3":
        rl.close();
        return;
      default:
        console.log("Invalid choice. Please try again.");
    }
  }
}

main();
