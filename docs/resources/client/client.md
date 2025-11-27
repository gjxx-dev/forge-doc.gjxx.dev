# 资源包

[资源包][respack] 允许通过 `assets` 目录自定义客户端资源。这包括纹理、模型、声音、本地化文本等。你的模组（以及 Forge 本身）也可以有自己的资源包。因此任何用户都可以修改此目录下定义的所有纹理、模型和其他资源。

### 创建资源包
资源包存放在项目的资源中。`assets` 目录包含包的实际内容，而资源包本身通过与 `assets` 文件夹并列的 `pack.mcmeta` 来定义。
你的模组可以拥有多个资源域（asset domain），因为你可以添加或修改已有的资源包，例如原版、Forge 或其他模组的资源包。
你可以按照 [Minecraft 维基][createrespack] 上的步骤来创建资源包。

扩展阅读：[资源定位符（Resource Locations）][resourcelocation]

[respack]: https://minecraft.wiki/w/Resource_Pack
[createrespack]: https://minecraft.wiki/w/Tutorials/Creating_a_resource_pack
[resourcelocation]: ../../concepts/resources.md#ResourceLocation
