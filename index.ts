import { Command } from "commander"
import { logger } from "./src/utils/logger.js"
import { Configuration, defaultConfig } from "./src/typings/typings.js"

import fs from "node:fs"
import path from "node:path"
import { BaseAgent } from "./src/structures/BaseAgent.js"
import { InquirerConfig } from "./src/structures/Inquirer.js"

const program = new Command()
const agent = new BaseAgent()

process.on("unhandledRejection", (error) => {
    logger.error(error as Error)
    logger.log("runtime", "Unhandled promise rejection")
}).on("uncaughtException", (error) => {
    logger.error(error as Error)
    logger.log("runtime", "Uncaught exception")
})

program
    .name("BKI Advanced Discord OwO Selfbot")
    .description("BKI Kyou Izumi Advanced Discord OwO Selfbot")
    .version(JSON.parse(fs.readFileSync("./package.json", "utf-8")).version || "3.0.0")

program
    .option("-g, --generate [filename]", "Generate new data file for autorun")
    .option("-i, --import <filename>", "Import data file for autorun")
    .option("-d, --debug", "Enable debug mode")
    .action(async () => {
        if (program.opts().debug) {
            logger.logger.level = "debug"
            logger.info("Debug mode enabled!")
        }

        if (program.opts()?.generate) {
            const filename = typeof program.opts().generate === "string" ? program.opts().generate : "autorun.json"
            if (fs.existsSync(filename) && fs.statSync(filename).size > 0) {
                return logger.error(`File ${filename} already exists and is not empty!\nPlease remove it or specify another filename.`)
            }

            fs.writeFileSync(filename, JSON.stringify({}, null, 4))
            logger.info(`File generated: ${path.resolve(filename)}`)
            return;
        }

        if (program.opts()?.import) {
            if (!fs.existsSync(program.opts().import)) return logger.error(`File ${program.opts().import} does not exist!`)
            if (path.extname(program.opts().import) !== ".json") return logger.error(`File ${program.opts().import} is not a JSON file!`)

            const data = JSON.parse(fs.readFileSync(path.resolve(program.opts().import), "utf-8")) as Configuration
            if (!data) return logger.error(`File ${program.opts().import} is empty!`)
            try {
                await agent.checkAccount(data.token);
                agent.run(data)
            } catch (error) {
                logger.error(error as Error)
                logger.error("Failed to import data file")
            }
        } else {
            const config = await InquirerConfig(agent)
            agent.run(config)
        }
    })

program.parse(process.argv)