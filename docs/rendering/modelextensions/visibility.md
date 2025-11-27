# 部件可见性

在模型 JSON 的顶层添加 `visibility` 条目可以控制模型不同部件（part）的可见性，从而决定它们是否应被烘焙进最终的 [`BakedModel`][bakedmodel]。对“部件”的定义取决于加载此模型的模型加载器，自定义加载器可以选择忽略此条目。Forge 提供的加载器中，仅[复合模型加载器][composite]和 [OBJ 加载器][obj] 使用此功能。`visibility` 条目以 `"部件名": boolean` 的形式指定。

下面是一个包含两个部件的复合模型示例，第二个部件不会被烘焙进最终模型，并演示两个子模型分别覆盖此可见性设置以仅显示第一个部件或显示两个部件：
```js
// mycompositemodel.json
{
  "loader": "forge:composite",
  "children": {
    "part_one": {
      "parent": "mymod:mypartmodel_one"
    },
    "part_two": {
      "parent": "mymod:mypartmodel_two"
    }
  },
  "visibility": {
    "part_two": false
  }
}

// mycompositechild_one.json
{
  "parent": "mymod:mycompositemodel",
  "visibility": {
    "part_one": false,
    "part_two": true
  }
}

// mycompositechild_two.json
{
  "parent": "mymod:mycompositemodel",
  "visibility": {
    "part_two": true
  }
}
```

给定部件的可见性通过如下方式确定：若模型自身为该部件指定了可见性，则使用之；否则递归检查其父模型，直到找到指定条目或不再有父模型，若都未找到则默认可见（true）。

这允许如下用法：
1. 一个复合模型指定多个部件
2. 多个模型将该复合模型作为父模型
3. 这些子模型分别为部件指定不同的可见性，从而共享并重用同一复合模型的不同部分

[bakedmodel]: ../modelloaders/bakedmodel.md
[composite]: ../modelloaders/modelloaders.md#composite-models
[obj]: ../modelloaders/modelloaders.md#wavefront-obj-models
