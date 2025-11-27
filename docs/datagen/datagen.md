# 数据生成器

数据生成器允许以编程方式生成模组的资源与数据文件。通过在代码中定义这些文件的内容并自动生成，开发者无需手动编写大量 JSON 文件，从而专注于数据的逻辑。

数据生成系统由主类 `net.minecraft.data.Main` 加载。可通过命令行参数定制哪些模组的数据会被收集、哪些已有文件应被视为存在等。负责数据生成的核心类为 `net.minecraft.data.DataGenerator`。

MDK 的默认 `build.gradle` 配置会添加 `runData` 任务，以便运行数据生成器。

已有文件（Existing Files）
-------------------------
所有对纹理或其它未由数据生成器生成的数据文件的引用，都必须在系统上实际存在。这样可以确保所有引用的纹理放置正确，从而及时发现并修正拼写错误。

`ExistingFileHelper` 负责校验这些数据文件是否存在。可通过 `GatherDataEvent#getExistingFileHelper` 获取其实例。

命令行参数 `--existing <folderpath>` 允许指定文件夹及其子文件夹作为存在性校验的来源。另可使用 `--existing-mod <modid>`，将某个已加载模组的资源用于校验。默认情况下，`ExistingFileHelper` 只可访问原版的数据包与资源。

生成器模式（Generator Modes）
-----------------------------
数据生成器可以配置为运行 4 种不同的生成模式，这些模式由命令行参数控制，并可通过 `GatherDataEvent#include***` 方法检查。

- 客户端资源（Client Assets）
  - 生成客户端专用的 `assets` 内容：方块/物品模型、blockstate JSON、语言文件等。
  - 参数：`--client`，对应方法 `#includeClient`。
- 服务器数据（Server Data）
  - 生成服务器端的 `data` 内容：配方、进度（advancements）、标签（tags）等。
  - 参数：`--server`，对应方法 `#includeServer`。
- 开发工具（Development Tools）
  - 运行一些开发辅助工具：例如 SNBT 与 NBT 的相互转换等。
  - 参数：`--dev`，对应方法 `#includeDev`。
- 报表（Reports）
  - 导出已注册的方块、物品、指令等信息。
  - 参数：`--reports`，对应方法 `#includeReports`。

要包含所有生成器，可使用 `--all`。

数据提供者（Data Providers）
---------------------------
数据提供者是实际定义要生成内容的类。所有数据提供者都实现 `DataProvider` 接口。Minecraft 为大多数资源与数据提供了抽象基类，模组开发者通常只需继承并重写指定方法。

`GatherDataEvent` 在创建数据生成器时会在模组事件总线上触发，可从事件中获取 `DataGenerator` 并通过 `DataGenerator#addProvider` 创建并注册数据提供者。

### 客户端资源（Client Assets）
- [`net.minecraftforge.common.data.LanguageProvider`][langgen] — 生成语言字符串，重写 `#addTranslations`。
- [`net.minecraftforge.common.data.SoundDefinitionsProvider`][soundgen] — 生成 `sounds.json`，重写 `#registerSounds`。
- [`net.minecraftforge.client.model.generators.ModelProvider<?>`][modelgen] — 生成模型，重写 `#registerModels`。
  - [`ItemModelProvider`][itemmodelgen] — 物品模型
  - [`BlockModelProvider`][blockmodelgen] — 方块模型
- [`net.minecraftforge.client.model.generators.BlockStateProvider`][blockstategen] — 生成 blockstate JSON 及其方块/物品模型，重写 `#registerStatesAndModels`。

### 服务器数据（Server Data）

以下类位于 `net.minecraftforge.common.data` 包中：

- [`GlobalLootModifierProvider`][glmgen] — 生成全局掉落修饰（global loot modifiers），重写 `#start`。
- [`DatapackBuiltinEntriesProvider`][datapackregistriesgen] — 用于 datapack 注册表对象，构造时传入 `RegistrySetBuilder`。

以下类位于 `net.minecraft.data` 包中：

- [`loot.LootTableProvider`][loottablegen] — 生成掉落表（loot tables），构造时传入 `LootTableProvider$SubProviderEntry`。
- [`recipes.RecipeProvider`][recipegen] — 生成配方及其解锁用的进度（advancements），重写 `#buildRecipes`。
- [`tags.TagsProvider`][taggen] — 生成标签（tags），重写 `#addTags`。
- [`advancements.AdvancementProvider`][advgen] — 生成进度（advancements），构造时传入 `AdvancementSubProvider`。

[langgen]: ./client/localization.md
[soundgen]: ./client/sounds.md
[modelgen]: ./client/modelproviders.md
[glmgen]: ./server/glm.md
[datapackregistriesgen]: ./server/datapackregistries.md
[loottablegen]: ./server/loottables.md
[recipegen]: ./server/recipes.md
[taggen]: ./server/tags.md
[advgen]: ./server/advancements.md
[lang]: https://minecraft.wiki/w/Language
[models]: ../resources/client/models/index.md
[recipes]: ../resources/server/recipes/index.md
[loottable]: ../resources/server/loottables.md