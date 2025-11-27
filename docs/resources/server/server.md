# 数据包（Datapacks）

在 1.13 中，Mojang 在原版游戏中加入了[数据包][datapack]功能。它们允许通过 `data` 目录修改逻辑服务器所使用的文件，比如进度（advancements）、掉落表（loot_tables）、结构（structures）、配方（recipes）、标签（tags）等。Forge 与你的模组也可以包含数据包。因此任何用户都可以修改位于该目录内定义的配方、掉落表以及其它数据。

### 创建数据包
数据包存放在项目资源中的 `data` 目录下。
你的模组可以拥有多个数据域（data domains），因为你可以添加或修改已有的数据包（例如原版、Forge 或其它模组的数据包）。
可以按[此处][createdatapack]的步骤来创建数据包。

延伸阅读：[资源定位符（Resource Locations）][resourcelocation]

[datapack]: https://minecraft.wiki/w/Data_pack
[createdatapack]: https://minecraft.wiki/w/Tutorials/Creating_a_data_pack
[resourcelocation]: ../../concepts/resources.md#ResourceLocation

```
# 数据包（Datapacks）

在 Minecraft 1.13 中，Mojang 向游戏核心添加了 [数据包][datapack] 功能。数据包允许通过 `data` 目录修改服务器端的逻辑资源文件，包括进度（advancements）、战利品表（loot_tables）、结构（structures）、配方（recipes）、标签（tags）等。Forge 与你的模组也可以包含数据包。因此，用户可以修改 `data` 目录中定义的所有配方、战利品表以及其他数据。

创建数据包
-----------

数据包应存放在项目资源的 `data` 目录下。你的模组可以拥有多个数据域（data domains），因为你可以添加或修改已存在的数据包，例如原版（vanilla）、Forge 或其他模组的数据包。

你可以按照 [创建数据包的教程][createdatapack] 中的步骤来创建数据包。

延伸阅读：[资源定位符（Resource Locations）][resourcelocation]

[datapack]: https://minecraft.wiki/w/Data_pack
[createdatapack]: https://minecraft.wiki/w/Tutorials/Creating_a_data_pack
[resourcelocation]: ../../concepts/resources.md#ResourceLocation
[createdatapack]: https://minecraft.wiki/w/Tutorials/Creating_a_data_pack
