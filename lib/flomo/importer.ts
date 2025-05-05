import * as path from 'path';
import * as os from 'os';
import *  as fs from 'fs-extra';

import { App } from 'obsidian';
import decompress from 'decompress';
import * as parse5 from "parse5"

import { FlomoCore } from './core';
import { generateMoments } from '../obIntegration/moments';
import { generateCanvas } from '../obIntegration/canvas';

import { FLOMO_CACHE_LOC } from './const'
//const FLOMO_CACHE_LOC = path.join(os.homedir(), "/.flomo/cache/");


export class FlomoImporter {
    private config: Record<string, any>;
    private app: App;

    constructor(app: App, config: Record<string, any>) {
        this.config = config;
        this.app = app;
    }

    private async sanitize(path: string): Promise<string> {
        const flomoData = await fs.readFile(path, "utf8");
        const document = parse5.parse(flomoData);
        return parse5.serialize(document);
    }

    private async importMemos(flomo: FlomoCore): Promise<FlomoCore> {
        const allowBilink: boolean = this.config["expOptionAllowbilink"];
        const margeByDate: boolean = this.config["mergeByDate"];

        for (const [idx, memo] of flomo.memos.entries()) {

            const memoSubDir = `${this.config["flomoTarget"]}/${this.config["memoTarget"]}/${memo["date"]}`;
            const memoFilePath = margeByDate ? `${memoSubDir}/memo@${memo["date"]}.md` : `${memoSubDir}/memo@${memo["title"]}_${flomo.memos.length - idx}.md`;

            await fs.mkdirp(`${this.config["baseDir"]}/${memoSubDir}`);
            const content = (() => {
                // @Mar-31, 2024 Fix: #20 - Support <mark>.*?<mark/>
                // Break it into 2 stages, too avoid "==" translating to "\=="
                //  1. Replace <mark> & </mark> with FLOMOIMPORTERHIGHLIGHTMARKPLACEHOLDER (in lib/flomo/core.ts)
                //  2. Replace FLOMOIMPORTERHIGHLIGHTMARKPLACEHOLDER with ==
                const res = memo["content"].replaceAll("FLOMOIMPORTERHIGHLIGHTMARKPLACEHOLDER", "==");

                if (allowBilink == true) {
                    return res.replace(`\\[\\[`, "[[").replace(`\\]\\]`, "]]");
                }

                return res;

            })();

            if (!(memoFilePath in flomo.files)) {
                flomo.files[memoFilePath] = []
            }

            flomo.files[memoFilePath].push(content);
        }

        for (const filePath in flomo.files) {
            await this.app.vault.adapter.write(
                filePath,
                flomo.files[filePath].join("\n\n---\n\n")
            );
        }

        return flomo;
    }

    async import(): Promise<FlomoCore> {

        // 1. Create workspace
        const tmpDir = path.join(FLOMO_CACHE_LOC, "data")
        await fs.mkdirp(tmpDir);

        // 2. Unzip flomo_backup.zip to workspace
        const files = await decompress(this.config["rawDir"], tmpDir)

        // 3. copy attachments to ObVault
        const obVaultConfig = await fs.readJson(`${this.config["baseDir"]}/${this.app.vault.configDir}/app.json`)
        const attachementDir = obVaultConfig["attachmentFolderPath"] + "/flomo/";

        for (const f of files) {
            if (f.type == "directory" && f.path.endsWith("/file/")) {
                console.debug(`DEBUG: copying from ${tmpDir}/${f.path} to ${this.config["baseDir"]}/${attachementDir}`)
                await fs.copy(`${tmpDir}/${f.path}`, `${this.config["baseDir"]}/${attachementDir}`);
                break
            }

        }

        // 4. Import Memos
        // @Mar-31, 2024 Fix: #21 - Update default page from index.html to <userid>.html
        const defaultPage = (await fs.readdir(`${tmpDir}/${files[0].path}`)).filter((fn, _idx, fn_array) => fn.endsWith('.html'))[0];
        const dataExport = await this.sanitize(`${tmpDir}/${files[0].path}/${defaultPage}`);
        
        // 从配置中获取已同步的备忘录IDs，用于增量同步
        const syncedMemoIds = this.config["syncedMemoIds"] || [];
        console.debug(`DEBUG: Loaded ${syncedMemoIds.length} synced memo IDs for incremental sync`);
        
        // 将已同步的备忘录IDs传递给FlomoCore
        const flomo = new FlomoCore(dataExport, syncedMemoIds);

        const memos = await this.importMemos(flomo);

        // 5. Ob Intergations
        // If Generate Moments
        if (this.config["optionsMoments"] != "skip") {
            await generateMoments(this.app, memos, this.config);
        }


        // If Generate Canvas
        if (this.config["optionsCanvas"] != "skip") {
            await generateCanvas(this.app, memos, this.config);
        }


        // 6. Cleanup Workspace
        await fs.remove(tmpDir);

        return flomo

    }

    public async importFlomoFile(filePath: string, mergeDayFile: boolean = true): Promise<{ count: number, newCount: number }> {
        if (filePath === undefined) {
            throw new Error("filepath undefined");
        }
        const config = this.config;
        if (!await fs.exists(filePath)) {
            throw new Error("File doesn't exist: " + filePath);
        }
        let folder = ""

        if(config.flomoTarget !== undefined) {
            folder = config.flomoTarget;
        }
        else {
            folder = "flomo";
        }

        if (!await fs.exists(folder)) {
            await fs.mkdir(folder);
        }

        // Extract basic information
        let flomoData: string = await this.sanitize(filePath);

        // 从配置中获取已同步的备忘录ID列表
        const syncedMemoIds = this.config.syncedMemoIds || [];
        console.debug(`从配置中读取到 ${syncedMemoIds.length} 条已同步记录`);

        // 将已同步ID传递给FlomoCore
        const flomo = new FlomoCore(flomoData, syncedMemoIds);
        
        const totalMemos = flomo.memos.length;
        const newMemos = flomo.newMemosCount;
        console.log(`总共找到 ${totalMemos} 条备忘录，其中 ${newMemos} 条是新的`);

        // 将所有日记按日期分组
        const dayGroups: Record<string, Record<string, string>[]> = {};

        // 只对新增的备忘录进行处理
        flomo.memos.forEach((memo) => {
            // 检查这个备忘录是否有ID（应该都有）
            if (memo.id) {
                // 检查这个ID是否在旧的已同步列表中（不应该在，因为FlomoCore已经过滤过了）
                // 但为了安全起见，这里再次检查
                if (!syncedMemoIds.includes(memo.id)) {
                    // 这是一个新备忘录
                    const day = memo.date;
                    if (day in dayGroups) {
                        dayGroups[day].push(memo);
                    } else {
                        dayGroups[day] = [memo];
                    }
                }
            }
        });

        // 更新配置中的已同步ID列表 - 合并旧的和新发现的ID
        this.config.syncedMemoIds = [...new Set([...syncedMemoIds, ...flomo.syncedMemoIds])];
        console.debug(`更新后的同步记录数: ${this.config.syncedMemoIds.length}`);
        
        // 更新最后同步时间
        this.config.lastSyncTime = Date.now();

        // 保存配置（这里是假设的，实际保存应该在外部进行）
        // 主要是让调用方知道需要保存配置

        for (let day in dayGroups) {
            if (mergeDayFile && dayGroups[day].length > 1) {
                const groupFiles = dayGroups[day];
                // TODO: Add file check, prompt if existing. Currently just overwriting
                
                const content = groupFiles.map((i) => {
                    return i.content;
                }).join("\n\n---\n\n");

                const fileName = groupFiles[0].title + ".md";
                await fs.writeFile(path.join(folder, fileName), content, 'utf8');
                

            } else {
                for (let i = 0; i < dayGroups[day].length; i++) {
                    const memo = dayGroups[day][i];
                    // 如果当日仅有一条记录，则按照title(date).md保存
                    // 如果当日有多条需要分开保存，则按照title(date)_sequence.md保存
                    let fileName = memo.title;
                    // 添加序号，防止文件名冲突
                    if (dayGroups[day].length > 1) {
                        fileName += "_" + (i + 1);
                    }
                    fileName += ".md";
                    await fs.writeFile(path.join(folder, fileName), memo.content, 'utf8');
                }
            }
        }

        // 额外生成Obsidian的Moments或Canvas
        if (config.optionsMoments === "copy_with_link" || 
            config.optionsMoments === "copy_with_content") {
            await generateMoments(this.app, flomo, config);
        }

        if (config.optionsCanvas === "copy_with_link" || 
            config.optionsCanvas === "copy_with_content") {
            await generateCanvas(this.app, flomo, config);
        }

        return { count: totalMemos, newCount: newMemos };
    }

}
