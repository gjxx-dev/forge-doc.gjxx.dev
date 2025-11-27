# 渲染类型

在模型 JSON 的顶层添加 `render_type` 条目可以向加载器建议该模型应使用的渲染类型。如果未指定，加载器可自行选择渲染类型，通常回退到 `ItemBlockRenderTypes#getRenderLayers()` 返回的类型。

自定义模型加载器可以完全忽略此字段。

!!! note
    自 1.19 起，优先使用此方法而不是通过 `ItemBlockRenderTypes#setRenderLayer()`（已弃用）设置适用渲染类型。

下面是一个使用玻璃纹理的切割（cutout）方块模型示例：

```js
{
  "render_type": "minecraft:cutout",
  "parent": "block/cube_all",
  "textures": {
    "all": "block/glass"
  }
}
```

原版可选值
--------------

Forge 在 `NamedRenderTypeManager#preRegisterVanillaRenderTypes()` 中提供了下列命名选项（含对应的区块与实体渲染类型）：

* `minecraft:solid`
    * 区块渲染类型：`RenderType#solid()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_SOLID`
    * 用于完全不透明的方块（例如石头）
* `minecraft:cutout`
    * 区块渲染类型：`RenderType#cutout()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_CUTOUT`
    * 用于像素要么完全透明要么完全不透明的方块（例如玻璃）
* `minecraft:cutout_mipped`
    * 区块渲染类型：`RenderType#cutoutMipped()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_CUTOUT`
    * 由于实体渲染的 mipmapping 行为不同，区块与实体类型不同
    * 用于像素要么完全透明要么完全不透明且在远处应启用 mipmapping 的情形（例如树叶）
* `minecraft:cutout_mipped_all`
    * 区块渲染类型：`RenderType#cutoutMipped()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_CUTOUT_MIPPED`
    * 与 `cutout_mipped` 类似，但项呈现也应使用 mipmapping
* `minecraft:translucent`
    * 区块渲染类型：`RenderType#translucent()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_TRANSLUCENT`
    * 用于像素可能部分透明的方块（例如染色玻璃）
* `minecraft:tripwire`
    * 区块渲染类型：`RenderType#tripwire()`
    * 实体渲染类型：`ForgeRenderTypes#ITEM_LAYERED_TRANSLUCENT`
    * 由于 tripwire 渲染类型无法作为实体渲染类型使用，区块与实体类型不同
    * 用于需要渲染到天气渲染目标的方块（例如 tripwire）

自定义值
-------------

可以在 `RegisterNamedRenderTypesEvent` 中注册可在模型中使用的自定义命名渲染类型。该事件在 mod 事件总线上触发。

一个自定义命名渲染类型由两到三个组件组成：

* 区块渲染类型 — 可以使用 `RenderType.chunkBufferLayers()` 返回列表中的任意类型
* 一个使用 `DefaultVertexFormat.NEW_ENTITY` 顶点格式的渲染类型（“实体渲染类型”）
* 一个在 *Fabulous!* 图形模式下使用的实体渲染类型（可选）

区块渲染类型在区块作为区块几何体的一部分渲染时使用。  
必需的实体渲染类型在快速或华丽（Fast and Fancy）图形模式下用于物品的实体渲染（物品栏、地面、物品框等）。  
可选的实体渲染类型在 *Fabulous!* 模式下替代必需实体渲染类型使用（解决某些需要在 Fabulous! 下不同渲染类型的问题，通常用于半透明类型）。

```java
public static void onRegisterNamedRenderTypes(RegisterNamedRenderTypesEvent event)
{
  event.register("special_cutout", RenderType.cutout(), Sheets.cutoutBlockSheet());
  event.register("special_translucent", RenderType.translucent(), Sheets.translucentCullBlockSheet(), Sheets.translucentItemSheet());
}
```

注册后可在 JSON 中以 `<your_mod_id>:special_cutout` 或 `<your_mod_id>:special_translucent` 使用。

[mipmapping]: https://en.wikipedia.org/wiki/Mipmap
