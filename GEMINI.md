# Antigravity Rules & Security Guidelines

## 1. PowerShell & Terminal Execution Policy
- **Allowed Automatically**: You are permitted to execute PowerShell and CLI commands automatically without prompting the user for confirmation, provided they relate to project development, inspection, building, running, or testing (e.g., `dotnet`, `npm`, `node`, `git` read commands, project-level scripts, directory queries).
- **STRICTLY FORBIDDEN Without Prior Written User Approval**: You MUST NOT run any PowerShell or OS commands that alter system settings, operating system configuration, or machine-level states. These include:
  - Modifying the Windows Registry (`Set-ItemProperty`, `New-Item`, `Remove-ItemProperty`, `reg.exe`, etc.)
  - Modifying Windows Services or System Processes (`Set-Service`, `Stop-Service`, `sc.exe`, etc.)
  - Modifying System-wide Environment Variables (`[Environment]::SetEnvironmentVariable(..., "Machine")`, `setx /M`, etc.)
  - Altering Windows Firewall, Network, or Security configurations (`netsh`, `Set-NetFirewallRule`, etc.)
  - Modifying user accounts, privileges, or file system permissions (`net user`, `icacls`, `takeown`, etc.)
  - Changing PowerShell Execution Policy (`Set-ExecutionPolicy`)
  - Any delete or modify operations targeting system directories or anything on Drive `C:\`.

## 2. File Access Policy
- **Drive C Restriction**: You are STRICTLY PROHIBITED from reading, searching, or inspecting any files or folders located on Drive `C:\` (e.g. `C:\*`).
- **Allowed Scope**: You may read and access all files within this project repository (`D:\graphBPMS-GitSource`) and any other non-C drives (e.g., `D:\`, `E:\`).
- If an operation ever appears to require accessing Drive `C:\`, explicitly halt and ask for user confirmation first.

## 3. Git Execution Policy
- **Automatic Execution**: You are permitted to execute read-only, informational, and inspection git commands automatically without asking for user approval (`git status`, `git diff`, `git log`, `git branch`, `git show`).
- **Strict Security Confirmation Required**: You MUST NOT execute any of the following commands without explicit, prior written approval from the user in chat:
  - `git commit`
  - `git push`
  - `git stash` (including stash apply, drop, pop)
  - `git reset` (soft, mixed, or hard)
  - Any command that removes, rewrites, or modifies git history (e.g., `git revert`, `git rebase`, `git checkout -- .`, `git restore .`)

## 4. Code Modifications & Approvals
- Do NOT prompt the user for permission before modifying each individual file.
- When code modifications are required, present a clear, unified implementation plan or summary.
- **Single Approval**: Once the user approves the plan once, apply all code changes across all relevant files continuously and autonomously without further interruption.

## 5. Project Coding Style & Handwriting Conventions ("دست‌خط و سبک برنامه‌نویسی")
When writing, modifying, or refactoring JavaScript code in this repository (especially under `Content/src/components/process/bpmn/engine/`), you MUST strictly match the author's established conventions:

### A. BPMN.js Engine & DI Architecture
1. **Dependency Injection**:
   - Always declare dependencies via `static $inject = ['eventBus', 'contextPad', ...];`.
   - Pass injected services into the constructor and bind them to private underscore-prefixed properties: `this._eventBus = eventBus;`, `this._contextPad = contextPad;`.
   - Self-register providers in constructor: `contextPad.registerProvider(this);` or `popupMenu.registerProvider(IDENTIFIER, PRIORITY, this);`.
2. **Modular Architecture**:
   - Define module registration objects using `__init__` and tuple syntax:
     ```javascript
     const myModule = {
         __init__: ['myProvider'],
         myProvider: ['type', MyProvider]
     };
     ```
3. **Event Normalization & Proxies**:
   - Use `Proxy` where necessary to intercept or normalize browser/keyboard events (`new Proxy(event, { get(target, property) { ... } })`).

### B. UI Templating & Component Integration
1. **HTML Builders & Templates**:
   - Encapsulate HTML templates inside clean object namespaces (e.g., `HtmlBuilder = { ... }`).
   - Use multi-line ES6 template literals (`` `<div>...</div>` ``) with readable indentation.
   - Use Knockout.js declarative data bindings (`data-bind="dxTextBox: ..."` or `<!-- ko if: ... -->`).
   - Integrate DevExtreme UI widgets consistently (`dxButton`, `dxSelectBox`, `dxPopup`, `dxTextBox`, `dxDataGrid`).
2. **Localization**:
   - Never hardcode user-facing texts; always wrap them in `translate('KeyName')`.
   - Strictly prohibit fallback string literals such as `translate("KeyName") || 'متن فارسی'`. Every user-facing message or text must have its translation key defined in `SharedResource.fa.resx` (and other resource files if applicable), and in JavaScript code, call ONLY `translate('KeyName')` without any default fallback string operator.
3. **Icons & Styling**:
   - Use FontAwesome / GraphBPMS icon classes (`fa-regular fa-*`, `dock-icon-fa`, `fa-fw`, `gb-*`).
   - Use configuration rule arrays with regex matchers (`ICON_RULES = [{ match: /^append\.end-event$/, faClass: 'fa-regular fa-circle', group: 'append', title: 'End Event' }]`).

### C. Syntax, Formatting & Clean Code
1. **Coding Style**:
   - 4-space indentation for code, 2 or 4 spaces inside template structures.
   - Use `const` and `let` (never `var`).
   - Use modern ES6+ features: destructuring (`const { svgAppend, svgAttr } = bpm.getTinyRenderObject();`), arrow functions, template literals, optional chaining (`?.`), and nullish coalescing (`??`).
   - Early returns / Guard clauses for readability (`if (!rule) return;`).
   - Spread operator for immutability: `{ ...entries[id], ... }`.
2. **Comments**:
   - Use concise Persian comments for business logic, UI grouping, and ordering steps (`// گروه ویرایش`, `// آیتم های فعال در ابتدای لیست`).
   - Use standard English comments and JSDoc for technical or mathematical helpers.

## 6. Technical Explanations & Staged Changes Policy (قالب استاندارد توضیحات و گزارش‌های فنی)
- **تفکیک گفتگوهای روزمره از گزارش‌های فنی**: در گفتگوها و تعاملات عادی بین ما (بررسی باگ، پرسش و پاسخ، ارائه پلن یا گزارش وضعیت کار)، پاسخ‌ها باید **به زبان ساده، روان، محاوره‌ای/عادی و خوانا** (در صورت نیاز با لیست و دسته‌بندی شفاف) نوشته شوند.
- **زمان استفاده از قالب رسمی تک‌پاراگرافی**: **صرفاً هنگامی که کاربر به صورت مشخص درخواست «توضیحات فنی»، «توضیح کامیت»، «توضیحات تغییرات استیج (`git diff --cached`)» یا «مستندسازی فنی یک تابع/کامپوننت» را می‌دهد**، باید دقیقاً ساختار و لحن استاندارد زیر را رعایت کنید:

1. **قالب متنی پیوسته و تک‌پاراگرافی (Single-Paragraph Prose Only)**:
   - اکیداً از هرگونه قالب‌بندی لیستی (علامت‌های بالت، خط تیره، شماره‌گذاری و بخش‌بندی‌های تکه‌تکه) خودداری کنید. کل توضیحات باید صرفاً در قالب متنی پیوسته ارائه شود.
   - **محدودیت قطعی پاراگراف**: متن باید **دقیقاً حداکثر در ۱ پاراگراف** ساخت‌یافته، منسجم و متمرکز تنظیم گردد.
   - **بیان مفید و جامع**: این تک‌پاراگراف باید در عین فشردگی، تغییرات اعمال‌شده، منطق و روش کار فنی را به صورت کاملاً جامع، مفید و دقیق بیان کند.

2. **لحن و نگارش (کتابی سالم، روان و قابل فهم برای همه)**:
   - **افعال کتابی و سالم**: افعال باید کامل و غیرشکسته باشند (`است`، `دارد`، `می‌کند`، `می‌شود`، `قرار می‌دهد`، `ذخیره می‌کند`، `تشکیل می‌دهند`). اکیداً از افعال عامیانه یا شکسته‌نویسی (مثل «میشه»، «داره»، «می‌کنه») استفاده نکنید.
   - **پرهیز از واژگان ثقیل دیوانی**: از لغات سخت، تصنعی و منسوخ اداری (مانند «محصور گردیده بود»، «انقباضی»، «متعاقب»، «مدفون گشتن») کاملاً اجتناب کنید.
   - **قابل فهم هم‌زمان برای افراد فنی و غیرفنی**: زبان متن باید زنده، ملموس و روان باشد؛ به گونه‌ای که چرایی و منطق کار برای افراد غیرفنی به راحتی قابل درک باشد، و در عین حال به علت ارجاع دقیق به متغیرها و نام‌ها، برای مهندسان نرم‌افزار غنای فنی کامل داشته باشد.

3. **ساختار منطقی درون‌پاراگراف**:
   - **شروع با معرفی مسئولیت**: مستقیماً با مسئولیت و نقش قطعه کد یا تغییرات آغاز شود (مانند: `این تغییرات مسئول **فلان هدف عملیاتی** است...`).
   - **جریان منطقی، روش کار و کدهای درگیر**: تحلیل شفاف روش کار با اتصال به کدهای واقعی و درج نام توابع، متغیرها، کلاس‌ها و کلیدها درون Backtick (مانند `` `ReferencesID` ``، `` `overflow: hidden` ``).
   - **نکته کلیدی معماری و گردش‌کار**: بیان شفاف ارزش افزوده معماری و جمع‌بندی چرخه تعاملی روش کار در قالب جملات پیوسته، روان و طبیعی زبان فارسی؛ **اکیداً و بدون استثنا از هرگونه استفاده از فلش، زنجیره رویدادها (مانند `مرحله ۱ → مرحله ۲ → مرحله ۳`) یا نمادگذاری‌های مرحله‌ای مشابه خودداری شود**.

## 7. Token Optimization & Context Efficiency Protocol (پروتکل بهینه‌سازی توکن و ایزولاسیون جستجو)
To preserve the user's token quota, prevent context bloat, and maintain peak response speed:
1. **MANDATORY: Priority Subagent Delegation for Deep & Multi-step Searches (الزام و اولویت اصلی و قطعی استفاده از ساب‌ایجنت)**:
   - **TOP PRIORITY / اولویت اول و اساسی**: شما موظفید در تمامی موارد زیر فوراً و بدون استثنا بررسی را به ساب‌ایجنت `research` محول کنید:
     * هرگونه جستجو یا ردیابی چندفایلی (Multi-file investigation across views, scripts, styles, controllers)
     * ردیابی‌های عمیق معماری، جریان داده، یا سلسله‌مراتب فراخوانی توابع (Deep code tracing)
     * بررسی لاگ‌های گیت، تاریخچه تغییرات، و مقایسه کامیت‌ها (`git log`, `git show`, `git diff`)
     * هرگونه عملیات کاوش کد که نیازمند اجرای چندین دستور جستجو یا خواندن بخش‌های مختلف است
   - **STRICT PROHIBITION (ممنوعیت شدید)**: اکیداً از انجام جستجوهای زنجیره‌ای، دستورات متعدد `git grep` یا بازخوانی مکرر برش‌های فایل در چت اصلی خودداری کنید. چت اصلی باید کاملاً تمیز بماند.
   - **پروتکل اجرا**: تمام کارهای تحقیقاتی و جستجوهای کثیف/طولانی در کانتکست ایزوله ساب‌ایجنت اجرا شده و ساب‌ایجنت صرفاً یک گزارش نهایی، دقیق و فوق‌العاده خلاصه شامل آدرس دقیق فایل‌ها و خطوط مرتبط را به چت اصلی برمی‌گرداند.
2. **Strict Surgical Reading (ممنوعیت بارگذاری کامل فایل‌های حجیم)**:
   - NEVER read entire large files (> 200 lines), such as `process.inbox.js`, `process.inbox.modern.css`, `bpmn.element.propeties.js`, `.cshtml`, or `.resx` files.
   - ALWAYS locate target functions or symbols first via `git grep -n` or scoped queries.
   - ALWAYS view only targeted slices (30 to 80 lines maximum) using `StartLine` and `EndLine`.
3. **BPMN XML & Resource Files Economy**:
   - Never paste or inspect full raw BPMN XML strings in the main chat. Target only relevant element tags.
   - When modifying `.resx` resource files, target strictly the new `<data>` entries at the end of the file rather than reading or replacing the entire XML document.
4. **Command Output Scoping & Session Hygiene**:
   - Limit command output lengths (e.g. `git log -n 5`, `git diff --stat`).
   - After completing and committing a major feature or bugfix, remind the user to start a new chat session to reset context memory and prevent token carryover.
5. **Mandatory `-w` Flag in Git Diffs (نادیده گرفتن تغییرات فضای خالی و CRLF در گیت)**:
   - ALWAYS include the `-w` flag (`--ignore-all-space`) when running `git diff` or `git show` (e.g., `git diff -w`, `git diff --cached -w`, `git show -w`) both in the main chat and inside subagents to prevent line-ending (`CRLF`/`LF`) or indentation noise from flooding the token context.
6. **Preserving Line-Endings & Scoped Formatting (حفظ فرمت خطوط و ممنوعیت فرمت کلی فایل‌های حجیم)**:
   - NEVER reformat an entire large file or alter its original line-endings (`CRLF` vs `LF`). Only format the specific lines or blocks being modified. When using scripts to modify files, explicitly detect and preserve the original line-ending sequence (`\r\n` on Windows).
7. **Script-Based Bulk Refactoring (استفاده خودکار از اسکریپت موقت برای تغییرات انبوه و الگومحور)**:
   - Whenever a task requires repetitive or pattern-based edits across large files (> 5 similar replacements, such as extracting hardcoded strings to `translate('...')` and appending `<data>` entries to `.resx` files), NEVER perform dozens of sequential `replace_file_content` tool calls. Instead, write and execute a temporary Node.js or PowerShell script in the workspace to apply all replacements atomically in one step while preserving `CRLF` line-endings, and immediately delete the temporary script afterward.

## 8. محدودیت درایو
- تمامی فایل‌ها و عملیات‌ها صرفاً در فضای کاری مخزن (`D:\graphBPMS-GitSource`) انجام شود و تغییری در درایو `C:\` اعمال نشود.

## 9. Chat Title Convention (قانون قالب عنوان گفتگو)
- در ابتدای گفتگوها، کاربر عنوان گفتگو را با فرمت `-- عنوان --` در خط اول وارد می‌کند و سوالات یا جزئیات درخواست را در خطوط پایین‌تر می‌نویسد.
- عنوان چت باید دقیقاً با فرمت زیر ثبت و منظور گردد:
  `[عنوان وارد شده در چت] + [تاریخ روز]`


