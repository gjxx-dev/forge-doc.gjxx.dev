# 面数据

在原版的 `elements` 模型中，可以在元素（element）层或面（face）层指定关于面（face）的附加数据。没有在面级别指定自己的面数据的面会回退到元素级的面数据；如果元素层也没有指定，则使用默认值。

要在生成的物品（generated item）模型中使用此扩展，模型必须通过 `forge:item_layers` 模型加载器加载，因为原版的物品模型生成器未扩展以读取这些附加数据。

所有面数据的值均为可选。

元素模型
--------------

在原版的 `elements` 模型中，面数据应用于其指定的面，或应用于该元素中所有未指定面数据的面。

!!!note
    如果在某个面上指定了 `forge_data`，该面将不会从元素级的 `forge_data` 继承参数。

下面示例展示了两种指定附加数据的方式：
```js
{
  "elements": [
    {
      "forge_data": {
        "color": "0xFFFF0000",
        "block_light": 15,
        "sky_light": 15,
        "ambient_occlusion": false
      },
      "faces": {
        "north": {
          "forge_data": {
            "color": "0xFFFF0000",
            "block_light": 15,
            "sky_light": 15,
            "ambient_occlusion": false
          },
          // ...
        },
        // ...
      },
      // ...
    }
  ]
}
```

生成的物品模型
--------------------

在使用 `forge:item_layers` 加载器生成的物品模型中，面数据为每个纹理层（layer）指定，并应用于该层的所有几何体（正/背面四边形及边缘四边形）。

`forge_data` 字段必须位于模型 JSON 的顶层，每个键值对将一个面数据对象与一个层索引关联。

在下面示例中，层 1 将被着色为红色并以满亮度发光：
```js
{
  "textures": {
    "layer0": "minecraft:item/stick",
    "layer1": "minecraft:item/glowstone_dust"
  },
  "forge_data": {
    "1": {
      "color": "0xFFFF0000",
      "block_light": 15,
      "sky_light": 15,
      "ambient_occlusion": false
    }
  }
}
```

参数说明
----------

### 颜色

通过 `color` 条目指定颜色值会将该颜色作为对四边形的染色（tint）。默认值为 `0xFFFFFFFF`（白色，完全不透明）。颜色必须为 ARGB 格式并打包为 32 位整数，可使用十六进制字符串（`"0xAARRGGBB"`）或十进制整数字面量（JSON 不支持十六进制整数字面量）。

!!! warning
    四个颜色分量会与纹理的像素值相乘。省略 alpha 分量等同于将其设为 0，这会使几何体完全透明。

当颜色值是常量时，这可以替代使用 [`BlockColor` 和 `ItemColor`][tinting] 进行着色。

### 方块与天空光

通过 `block_light` 和/或 `sky_light` 条目指定方块或天空光值，会覆盖四边形的相应光照值。两个值默认均为 0，必须在 0-15（含）范围内，并且在渲染时作为该类光照的最小值 —— 世界中更高的光值会覆盖该指定值。

指定的光值仅影响客户端，不会改变服务器的光照或周边方块的亮度。

### 环境遮蔽（Ambient Occlusion）

通过 `ambient_occlusion` 标志可以为四边形配置 AO，默认值为 `true`。此标志的行为等价于原版格式顶层的 `ambientocclusion` 标志。

![Ambient occlusion in action][ao_img]  
*左侧启用环境遮蔽，右侧禁用（演示 Smooth Lighting 视觉设置）*

!!! note
    如果顶层的 AO 标志被设置为 false，在元素或面上将该标志设置为 true 无法覆盖顶层设置。
    ```js
    {
      "ambientocclusion": false,
      "elements": [
        {
          "forge_data": {
            "ambient_occlusion": true // 无效果
          }
        }
      ]
    }
    ```

[tinting]: ../../resources/client/models/tinting.md
[AO]: https://en.wikipedia.org/wiki/Ambient_occlusion
[ao_img]: ./ambientocclusion_annotated.png
