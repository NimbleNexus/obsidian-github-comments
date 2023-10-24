import { cpSync, existsSync } from "fs";

// TODO: Accept vault path and fill in `.obsidian/plugins/${pluginName}`
// TODO: Touch `.hotreload`
// TODO: Warning / Error when overwriting or when `.git` found (avoid overwriting plugins already under development)

export default (targetVaultPath) => ({
    name: 'copy-to-vault',
    setup(build) {
        if (targetVaultPath) {
            if (existsSync(targetVaultPath)) {
                const FILES_TO_COPY = ['main.js', 'styles.css', 'manifest.json']
                build.onEnd(() => {
                    FILES_TO_COPY.forEach(filename => cpSync(filename, `${targetVaultPath}/${filename}`, { force: true }))
                    console.log(`copy-to-vault copied ${FILES_TO_COPY.length} files`)
                })
                console.log(`copy-to-vault configured for target path ${targetVaultPath}`)
            } else {
                console.log(`copy-to-vault not configured: target path ${targetVaultPath} does not exist`)
            }
        } else {
            console.log('copy-to-vault not configured: targetVaultPath is undefined')
        }
    }
})
