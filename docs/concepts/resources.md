# 资源（Resources）
=========

资源是游戏使用的额外数据，存储在数据文件中，而不是写在代码里。Minecraft 有两套主要的资源系统：面向逻辑客户端的 `assets`（用于视觉内容，如模型、纹理与本地化），以及面向逻辑服务端的 `data`（用于游戏机制，如配方与掉落表）。[资源包（resource packs）][respack] 控制前者，而[数据包（datapacks）][datapack] 控制后者。

在默认的模组开发工具链中，assets 与 data 目录位于项目的 `src/main/resources` 目录下。

当启用多个资源包或数据包时，这些包会被合并。通常位于高优先级（栈顶）的包中的文件会覆盖位于下方的包中的文件；然而对于某些文件（例如本地化文件与标签），内容会按键合并。模组在其 `resources` 目录中定义资源与数据包，但它们会被视作“模组资源（Mod Resources）”包的子集。模组资源包不可被禁用，但可以被其他资源包覆盖。模组数据包可以通过原版的 `/datapack` 命令禁用。

所有资源应使用蛇形命名（snake_case）的路径与文件名（小写，使用“_”分隔），在 1.11 及更高版本中会强制执行此规范。

`ResourceLocation`
------------------

Minecraft 使用 `ResourceLocation` 来标识资源。`ResourceLocation` 包含两个部分：命名空间（namespace）与路径（path）。它通常指向 `assets/<namespace>/<ctx>/<path>` 下的资源，其中 `ctx` 为根据使用场景不同而变化的上下文路径片段。当 `ResourceLocation` 以字符串形式写入/读取时，它的格式为 `<namespace>:<path>`。若字符串中省略命名空间及冒号，则在读取为 `ResourceLocation` 时命名空间会默认设为 `"minecraft"`。模组应当将其资源放在与其模组 id 相同名称的命名空间下（例如，模组 id 为 `examplemod` 则应分别在 `assets/examplemod` 和 `data/examplemod` 下放置资源，指向这些文件的 `ResourceLocation` 如 `examplemod:<path>`）。这并非强制要求，在某些情况下使用不同的命名空间（甚至多个命名空间）也是可取的。`ResourceLocation` 也在资源系统之外广泛使用，因为它们是标识对象的一个良好唯一键（例如参考[注册表（registries）][]）。

[respack]: ../resources/client/index.md
[datapack]: ../resources/server/index.md
[registries]: ./registries.md

