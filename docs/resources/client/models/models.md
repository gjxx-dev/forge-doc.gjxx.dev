# 模型

[模型系统][models] 是 Minecraft 为方块和物品提供形状定义的机制。通过模型系统，方块和物品被映射到它们的模型，从而决定它们的外观。模型系统的主要目标之一是允许资源包不仅改变纹理，还能改变整个方块/物品的形状。任何添加物品或方块的模组通常也包含一个用于其方块和物品的小型资源包。

模型文件
-----------

模型和纹理通过 [`ResourceLocation`][resloc] 关联，但在 `ModelManager` 中以 `ModelResourceLocation` 存储。模型会根据引用的位置不同通过方块或物品的注册名进行引用，视其是引用 [方块状态][statemodel] 还是 [物品模型][itemmodels]。方块的 `ModelResourceLocation` 通常由其注册名加上当前 [`BlockState`][state] 的字符串化结果构成，物品则使用注册名加上 `inventory`。

!!! note
    JSON 模型仅支持长方体（cuboid）元素；无法用原生 JSON 表示三角楔等复杂几何。要使用更复杂的模型，必须采用其他格式。

### 纹理

与模型类似，纹理也包含在资源包中并通过 `ResourceLocation` 引用。在 Minecraft 中，UV 坐标 (0,0) 被视为**左上角**。UV 的范围始终为 0 到 16；若纹理尺寸与此不同，坐标会进行缩放以适配。纹理应为正方形且边长为 2 的幂，否则会破坏 mipmapping（例如 1x1、2x2、8x8、16x16、128x128 是合理的；5x5、30x30 不建议；5x10、4x8 则完全不合适）。仅在纹理为[动画][animated]时才可以非正方形。

[models]: https://minecraft.wiki/w/Tutorials/Models#File_path
[resloc]: ../../../concepts/resources.md#resourcelocation
[statemodel]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[itemmodels]: https://minecraft.wiki/w/Tutorials/Models#Item_models
[state]: ../../../blocks/states.md
[uv]: https://en.wikipedia.org/wiki/UV_mapping
[animated]: https://minecraft.wiki/w/Resource_Pack?so=search#Animation

