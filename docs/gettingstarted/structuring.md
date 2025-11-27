# 项目结构

本节说明如何组织你的模组代码和资源以便与 Forge 的构建与运行实践保持一致。

源码布局
---------

建议采用标准的 Gradle 源集布局：

- Java/Kotlin 源代码：`src/main/java` 或 `src/main/kotlin`
- 资源（包括 `mods.toml`、资源文件、数据包等）：`src/main/resources`

在 `resources` 下组织你的 Minecraft 资源命名空间，例如：

```
src/main/resources/
  assets/examplemod/
    models/
    textures/
  data/examplemod/
    loot_tables/
    recipes/
  META-INF/mods.toml
```

包命名建议
---------

Java 包名应当以你的域名倒置开头（例如 `com.example.examplemod`），然后追加模块或功能分组。避免使用 `net.minecraftforge` 或其它库的顶级包名。

资源命名空间
---------

每个模组应使用单一的资源命名空间（namespace），通常与 `modId` 相同，例如 `examplemod`。数据与资产应存放在 `data/<namespace>/...` 与 `assets/<namespace>/...` 下。

构建工具与依赖
---------

使用 Forge 推荐的 Gradle 插件（见 `build.gradle` 或 `build.gradle.kts`）来处理构建、打包和依赖管理。不要将其他模组的代码直接包含在你的源码树中；应当通过 `compileOnly` 或 `runtimeOnly` 依赖来引用它们。

命名约定
---------

- `modId` 应为小写字母、数字或下划线。
- 资源路径必须以你模组的命名空间为前缀，例如 `assets/examplemod/textures/block/example.png`。

更多细节见 `gettingstarted/modfiles.md` 与 `concepts/registries.md`。
