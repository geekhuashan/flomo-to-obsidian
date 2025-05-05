# Flomo Importer

##### ☕️ Make Flomo Memos to Obsidian Notes.

- Discussion: [Discussion](https://github.com/jia6y/flomo-to-obsidian/discussions)
<br />

<img width="500" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/bbbf6658-b93e-4b81-b087-0dd8687958ad">


<br/>
<br/>

<img width="550" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/14059ed5-6ae8-4d39-bbfc-a651e29b3a53">


<br />
<br />

### Features supported
- `Auto Sync` & `Adhoc Sync`
- Customize target import location
- Support highlight mark
- Optional: Create `Flomo Canvas` (with content | file link)
- Optional: Create `Flomo Moments`
- Experimental: Support Bi-directional Links in memos
- Experimental: Merge Memos by date

<br />

## 项目结构概览

```
esbuild.config.mjs  - 构建配置文件
main.ts             - 插件入口文件
manifest.json       - 插件元数据
package.json        - 项目依赖和脚本
lib/
  flomo/            - Flomo相关功能
    auth.ts         - 认证功能
    const.ts        - 常量定义
    core.ts         - 核心功能
    exporter.ts     - 导出功能
    importer.ts     - 导入功能
  obIntegration/    - Obsidian集成
    canvas.ts       - Canvas功能
    moments.ts      - Moments功能
  ui/               - 用户界面
    auth_ui.ts      - 认证界面
    common.ts       - 通用UI组件
    main_ui.ts      - 主界面
    manualsync_ui.ts- 手动同步界面
    message_ui.ts   - 消息界面
```

## 开发与修改指南

### 开发环境设置
1. 克隆仓库
2. 安装依赖：`npm install`
3. 安装Playwright (必需)：`npx playwright@1.43.1 install`

### 修改模板和格式
如果需要修改导入的笔记格式或模板:
- 编辑 `lib/flomo/importer.ts` - 负责将Flomo笔记转换为Obsidian格式
- 编辑 `lib/obIntegration/moments.ts` - 修改Moments功能的显示方式
- 编辑 `lib/obIntegration/canvas.ts` - 修改Canvas展示格式

### 修改UI
- UI相关的修改主要集中在 `lib/ui/` 目录下
- 样式修改可以在 `styles.css` 文件中进行

### 构建项目
- 开发模式 (实时编译): `npm run dev`
- 生产构建: `npm run build`
- 构建后的文件为 `main.js`

### 版本管理
- 版本更新: `npm run version`
- 版本信息在 `manifest.json` 和 `versions.json` 中定义

<br />

### First time to use it?

#### Install Dependency
  - **Playwright (MUST HAVE) :** `npx playwright@1.43.1 install`
  - (this plugin was pre-built with version 1.43.1)

#### Install And Enable the plugin
  - Install `Flomo Importer` and enable it.

    <img width="225" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/88cff082-e33f-4671-ba24-7059c6bbce88">
  
  - Use the command `Open Flomo Importer`, or use `Import Button`
    
    <img width="230" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/28a31eaa-921d-49cb-a633-984d06550792">

#### Auto Sync
  - Click on "Auto Sync"

    <img width="350" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/71af02c3-9c14-4eec-b56f-d6207178ccd5">

  - Authentication is required if the first time syncs or the current sign-in expires.

    <img width="350" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/7754586a-e9e2-40b7-93c1-0dbcc0631a1e">

  - Exporting & Importing

    <img width="300" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/24910880-6201-497f-8359-191e476a5bed">



#### Adhoc Sync

###### 📦 **Export from Flomo**
  - Go to `Account Details` 
  - Select `Export All (as HTML)`
    
    <img width="350" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/b6222501-b0e7-45f4-8acb-6b489c9b1fc0">

  - Click on `Start to export`

###### 🎯 **Import to Obsidian**

  - Choose flomo.zip to Import. The `Flomo & Memo Home` is where to store your memos.

  - A Notice pops up when the import is completed.
    
  - Checkout **Flmomo Moments** and **Flomo Canvas** 🌅

    <img width="252" alt="image" src="https://github.com/jia6y/flomo-to-obsidian/assets/1456952/b1bd2399-87f1-4d60-80cf-111bbce8fe68">


<br />

### Support 🧑🏻‍💻
Please feel free to reach out or log an Issue if there are any questions. :)  
<br />
[Discussion](https://github.com/jia6y/flomo-to-obsidian/discussions)



