import fs from 'fs'

const BASE_DIR = './results/'

export const saveResultsFile = (name: string, content: any) => {
    fs.writeFileSync(BASE_DIR + name,  JSON.stringify(content))
}