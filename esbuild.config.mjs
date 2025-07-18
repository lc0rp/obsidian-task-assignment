import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";

const banner =
    `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
        ...builtins],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
    minify: prod,
});

// Copy styles.css to root directory
const copyStyles = () => {
    try {
        fs.copyFileSync("styles/styles.css", "styles.css");
        console.log("✓ Copied styles.css");
    } catch (error) {
        console.error("Failed to copy styles.css:", error.message);
    }

    // Also copy task roles view styles
    try {
        if (fs.existsSync("styles/task-roles-view.css")) {
            const mainStyles = fs.readFileSync("styles.css", "utf8");
            const viewStyles = fs.readFileSync("styles/task-roles-view.css", "utf8");
            fs.writeFileSync("styles.css", mainStyles + "\n\n" + viewStyles);
            console.log("✓ Merged task roles view styles");
        }
    } catch (error) {
        console.error("Failed to merge task roles view styles:", error.message);
    }
};

// Watch styles directory in development mode
const watchStyles = () => {
    if (!prod) {
        fs.watchFile("styles/styles.css", (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                copyStyles();
                console.log("✓ Styles updated");
            }
        });

        // Also watch task roles view styles
        if (fs.existsSync("styles/task-roles-view.css")) {
            fs.watchFile("styles/task-roles-view.css", (curr, prev) => {
                if (curr.mtime !== prev.mtime) {
                    copyStyles();
                    console.log("✓ Task roles view styles updated");
                }
            });
        }
    }
};

if (prod) {
    await context.rebuild();
    copyStyles();
    process.exit(0);
} else {
    await context.watch();
    copyStyles();
    watchStyles();
}
