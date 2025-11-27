# 根变换（Root Transforms）

在模型 JSON 的顶层添加 `transform` 条目可向加载器指示在块模型的 [blockstate] 文件中旋转之前（或在物品模型的 [display transforms][displaytransform] 之前）对所有几何体应用一次变换。该变换可在 `IUnbakedGeometry#bake()` 的 `IGeometryBakingContext#getRootTransform()` 中获取。

自定义模型加载器可以完全忽略此字段。

根变换可用两种格式指定：

1. 一个包含单一 `matrix` 条目的 JSON 对象，该条目为一个原始变换矩阵，表示为嵌套 JSON 数组且省略最后一行（3×4 矩阵，行主序）。该矩阵是平移、左旋转、缩放、右旋转与变换原点按此顺序组成的复合矩阵。例如：
    ```js
    "transform": {
        "matrix": [
            [ 0, 0, 0, 0 ],
            [ 0, 0, 0, 0 ],
            [ 0, 0, 0, 0 ]
        ]
    }
    ```
2. 一个包含以下任意组合可选条目的 JSON 对象：
    * `origin`：用于旋转与缩放的原点
    * `translation`：相对平移
    * `rotation` 或 `left_rotation`：在缩放前应用于已平移原点的旋转
    * `scale`：相对于已平移原点的缩放
    * `right_rotation` 或 `post_rotation`：在缩放后应用的旋转

元素级别指定
-------------------------

如果使用第 2 种方式按条目指定变换，这些条目将按 `translation`、`left_rotation`、`scale`、`right_rotation` 的顺序应用。最后转换会移动到指定的原点。

```js
{
    "transform": {
        "origin": "center",
        "translation": [ 0, 0.5, 0 ],
        "rotation": { "y": 45 }
    },
    // ...
}
```

元素字段期望如下定义：

### Origin（原点）

原点可以为一个包含 3 个浮点值的数组 `[ x, y, z ]`，也可以是下列默认值之一：

* `"corner"` (0, 0, 0)
* `"center"` (.5, .5, .5)
* `"opposing-corner"` (1, 1, 1)

若未指定原点，默认值为 `"opposing-corner"`。

### Translation（平移）

平移应为包含 3 个浮点值的数组 `[ x, y, z ]`，若缺省则为 (0, 0, 0)。

### 左/右旋转（Left and Right Rotation）

旋转可通过以下任意一种方式指定：

* 单一 JSON 对象，表示单轴度数映射：`{ "x": 90 }`
* 若干此类对象组成的数组（按指定顺序依次应用）：`[ { "x": 90 }, { "y": 45 } ]`
* 3 个浮点值的数组，分别表示绕 X/Y/Z 轴的度数：`[ 90, 180, 45 ]`
* 4 个浮点值的数组，直接指定四元数：`[ 0.38268346, 0, 0, 0.9238795 ]`（示例为绕 X 轴 45 度）

若未指定旋转，将默认为无旋转。

### Scale（缩放）

缩放应为 3 个浮点值的数组 `[ x, y, z ]`，若未指定则默认 (1, 1, 1)。

[blockstate]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[displaytransform]: ../modelloaders/transform.md
