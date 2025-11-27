# 入门：使用 Forge

如果你从未制作过 Forge 模组，本节将提供搭建 Forge 开发环境所需的最低信息。本仓库其余文档说明在此基础上接下来的方向。

先决条件
-------------

* 安装 Java 21 开发工具包（JDK）以及 64 位 Java 虚拟机（JVM）。Forge 推荐并官方支持使用 [Eclipse Temurin][jdk]。
* 熟悉某个集成开发环境（IDE）。
    * 建议使用带有 Gradle 集成的 IDE。

从零开始制作模组
--------------------

1. 从 [Forge 文件下载站][files] 下载 Mod Developer Kit（MDK）：点击“MDK”，等待页面右上角的跳过（Skip）按钮出现并点击。建议尽可能下载最新的 Forge 版本。
1. 将下载的 MDK 解压到一个空目录中，该目录即为你的模组目录，通常会包含若干 Gradle 文件和一个包含示例模组的 `src` 子目录。

    !!! note
        有若干文件可以在不同模组间复用，包括：

        * `gradle` 子目录
        * `build.gradle`
        * `gradlew`
        * `gradlew.bat`
        * `settings.gradle`

        `src` 子目录不需要跨工作区复制；若稍后创建了 `src/main/java` 或 `src/main/resources`，可能需要刷新 Gradle 项目以使 IDE 识别新源。

1. 打开你选择的 IDE：
    * Forge 明确支持 Eclipse 和 IntelliJ IDEA，但也提供 Visual Studio Code 的运行配置。无论如何，从 Apache NetBeans 到 Vim/Emacs 的任意环境均可使用。
    * Eclipse 与 IntelliJ IDEA 的 Gradle 集成都能在导入或打开项目时完成初始工作区设置（包括从 Mojang、MinecraftForge 等下载安装所需包）。Visual Studio Code 需安装“Gradle for Java”插件以实现同等功能。
    * 当对与项目相关的文件（例如 `build.gradle`、`settings.gradle` 等）做出修改时，需要重新评估 Gradle 配置。部分 IDE 提供“刷新”按钮，也可以在终端中使用 `gradlew` 完成。
1. 为选定的 IDE 生成运行配置：
    * **Eclipse**：运行 `genEclipseRuns` 任务。
    * **IntelliJ IDEA**：运行 `genIntellijRuns` 任务。如果出现“module not specified”错误，请设置 [`ideaModule` 属性][config] 为你的主模块（通常为 `${project.name}.main`）。
    * **Visual Studio Code**：运行 `genVSCodeRuns` 任务。
    * **其他 IDE**：也可直接运行 Gradle 任务（例如 `gradle run*`，如 `runClient`、`runServer`、`runData`、`runGameTestServer`），这些任务也可在支持的 IDE 中使用。

自定义模组信息
--------------------------------

编辑 `build.gradle` 以自定义模组的构建参数（例如产物名称、版本等）。

!!! important
    除非你非常了解其作用，否则**不要**编辑 `settings.gradle`。该文件指定了 ForgeGradle 上传所在的仓库。

### 推荐的 `build.gradle` 自定义项

#### 替换 Mod Id

将 `examplemod`（包括 `mods.toml` 与主类）替换为你模组的 id。同时通过设置 `base.archivesName` 更改构建产物的文件名（通常设置为 mod id）。

```gradle
// 在某个 build.gradle
base.archivesName = 'mymod'
```

#### Group Id

将 `group` 属性设置为你的顶级包名（应为你拥有的域名或邮箱）：

|  类型  |        值         | 顶级包名            |
| :----: | :---------------: | :------------------ |
|  域名  |    example.com    | `com.example`       |
| 子域名 | example.github.io | `io.github.example` |
|  邮箱  | example@gmail.com | `com.gmail.example` |

```gradle
group = 'com.example'
```

你的 Java 源代码目录 `src/main/java` 中的包结构应遵循此规则，并在次级包中包含 mod id，例如：`com.example.mymod`。

#### 版本

将 `version` 属性设置为当前模组版本，推荐使用一种 Maven 风格的扩展版（参见 [versioning]）。

```gradle
version = '1.21.1-1.0.0.0'
```

### 其他配置

更多配置请参阅 [ForgeGradle] 文档。

构建与测试你的模组
-----------------------------

1. 构建模组：运行 `gradlew build`。产物将输出到 `build/libs`，文件名格式为 `[archivesBaseName]-[version].jar`，可将其放入启用 Forge 的 Minecraft 的 `mods` 文件夹或用于分发。
1. 在测试环境中运行模组：使用生成的运行配置或相应任务（例如 `gradlew runClient`）。这将从运行目录（默认 `run`）启动 Minecraft，并包含任何指定的源码集。MDK 默认包含 `main` 源集，`src/main/java` 中的代码会被加载。
1. 运行独立服务端（`gradlew runServer`）时，服务端会首次立即退出，此时需在运行目录编辑 `eula.txt` 接受 Minecraft EULA，接受后服务器会继续加载并可通过 `localhost` 直连访问。

!!! note
    建议始终在独立服务器环境中测试你的模组。即使是[仅客户端的模组][client]，也应确保在服务器端不执行任何不应在服务器上运行的代码。

[jdk]: https://adoptium.net/temurin/releases?version=17 "Eclipse Temurin 17 Prebuilt Binaries"
[ForgeGradle]: https://docs.minecraftforge.net/en/fg-6.x

[files]: https://files.minecraftforge.net "Forge Files distribution site"
[config]: https://docs.minecraftforge.net/en/fg-6.x/configuration/runs/

[modfiles]: ./modfiles.md
[packaging]: ./structuring.md#packaging
[mvnver]: ./versioning.md
[client]: ../concepts/sides.md#writing-one-sided-mods
