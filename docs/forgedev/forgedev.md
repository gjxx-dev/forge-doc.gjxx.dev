# 入门

如果你决定为 Forge 做贡献，你需要采取一些特定步骤来开始开发。直接在一个普通的模组开发环境中工作并不足以处理 Forge 的代码库。下面的指南将帮助你搭建环境并开始为 Forge 提交改进。

Fork 与克隆仓库
-----------------

Forge 托管在 [GitHub][github]。如果你以前向其它开源项目贡献过，可能已经熟悉这个流程，可以跳到下一节。

对于不熟悉 Git 协作的新手，以下两个简单步骤帮助你入门。

!!! note
    本指南假设你已有 GitHub 账号；若没有，请先到其 [注册页面][register] 创建账号。本指南并不是 git 使用教程，如遇问题请参考其它资料。

### Fork

首先点击仓库右上角的“Fork”按钮，将 [MinecraftForge 仓库][forgerepo] fork 到你的账户或组织下。Fork 是必须的，因为并非每个 GitHub 用户都能直接向原仓库写入；你通过 fork 版本提交变更，然后发起 Pull Request。

### Clone

Fork 后，将仓库克隆到本地以便修改。使用你喜爱的 git 客户端或命令行将仓库克隆到指定目录，例如：

```bash
git clone https://github.com/<User>/MinecraftForge
```

# 检出正确的分支

Fork 与克隆是为 Forge 开发做准备的必要步骤。建议为每个计划提交的 PR 创建单独分支，这样可以同时保留最新的 Forge 更改用于新 PR，同时对已有补丁继续维护。

设置开发环境
------------

不同 IDE 的设置步骤有所差异，下文列出常见 IDE 的推荐设置方法。

### Eclipse

由于 Eclipse 工作区的机制，ForgeGradle 能完成大部分设置工作：

1. 打开终端并进入克隆的仓库目录。
2. 运行 `./gradlew setup` 并等待完成。  
3. 运行 `./gradlew genEclipseRuns` 并等待完成。  
4. 在 Eclipse 中选择 `File -> Import -> General -> Existing Gradle Project`。
5. 选择仓库根目录并完成导入。

导入完成后即可运行测试模组，无需额外步骤，选择合适的运行配置并运行即可。

### IntelliJ IDEA

IntelliJ 对 Gradle 有良好支持，但 Minecraft 模组开发有一些额外步骤：

#### IDEA 2021 及以后
1. 启动 IntelliJ IDEA 并使用 `Open` 打开克隆的 `MinecraftForge` 文件夹。
2. 若提示，选择 `Trust Project`。
3. 等待索引完成后，在 Gradle 面板运行 `setup` 任务（Forge -> Tasks -> other -> `setup`）。
4. 运行 `genIntellijRuns` 任务生成运行配置（Forge -> Tasks -> forgegradle runs -> `genIntellijRuns`）。

若构建时报许可错误，可尝试运行 `updateLicenses` 任务。

#### IDEA 2019-2020
导入方式稍有不同：使用 `Import Project` 并选择 `build.gradle`，随后运行 `setup`、`genIntellijRuns` 以及所需的运行任务（如 `forge_client`）。

完成上述步骤后，你应该能够在 Forge 与 Vanilla 代码基础上进行修改并运行测试。

制作变更与提交 PR
-------------------

设置好环境后，就可以对 Forge 代码库进行修改。注意一些坑点：若要修改 Minecraft 源码，只应在 `Forge` 子项目中修改，切勿在 `Clean` 项目中直接更改其源码，这会破坏 ForgeGradle 的补丁生成流程。

### 生成补丁

当你修改并测试完后，如果更改涉及 Minecraft 源码（即 `Forge` 项目），需要生成补丁以便注入到原版中。运行 `genPatches` Gradle 任务可以生成变更集，随后提交变更并发起 PR。

### 提交 Pull Request

最后一步是创建 Pull Request，将你的 fork 改动请求合并回主仓库。可以在 GitHub 的比较页面发起 PR。良好的分支管理能让你精确选择要提交的改动。

!!! note
    PR 有相关规则，并非所有请求都会被接受。请参阅贡献说明并遵循 PR 指南以提高通过概率。

[github]: https://www.github.com
[register]: https://www.github.com/join
[forgerepo]: https://www.github.com/MinecraftForge/MinecraftForge
[gradle]: https://www.gradle.org
[submitpr]: https://github.com/MinecraftForge/MinecraftForge/compare
[contribute]: https://github.com/MinecraftForge/MinecraftForge/blob/1.13.x/CONTRIBUTING.md
[guidelines]: ./prguidelines.md
