# 自定义模型加载器

“模型”只是一个形状。它可以是一个简单的立方体、多个立方体、截断的二十面体，或任意复杂的形状。大部分你看到的模型都是原版 JSON 格式。其他格式的模型在运行时通过 `IGeometryLoader` 加载为 `IUnbakedGeometry`。Forge 为 WaveFront OBJ、桶（bucket）、复合模型（composite models）、不同渲染层的模型以及对原版 `builtin/generated` 项目模型的重实现提供了默认实现。大多数实现不关心模型是如何加载或采用何种格式，因为在代码层面它们最终都会表示为 `BakedModel`。

!!! warning
    在模型 JSON 的顶层通过 `loader` 条目指定自定义模型加载器时，除非自定义加载器消费（consume）`elements` 条目，否则该 `elements` 条目将被忽略。其他所有原版条目仍会加载并存在于未烘焙的 `BlockModel` 表示中，且可在自定义加载器之外被使用。

WaveFront OBJ 模型
--------------------

Forge 增加了对 `.obj` 文件格式的加载器。要使用这些模型，JSON 必须引用 `forge:obj` 加载器。该加载器接受命名空间下路径以 `.obj` 结尾的模型位置。相应的 `.mtl` 文件应放在同一位置并与 `.obj` 同名以便自动使用。通常需要手动编辑 `.mtl` 文件以更改指向 JSON 中定义纹理的路径。此外，纹理的 V 轴方向可能因创建模型的外部程序而被翻转（例如 V=0 可能表示底边而不是顶边）。可以在建模程序中修正，或者在模型 JSON 中通过如下方式修正：

```js
{
  // 在与 'model' 声明同一级别添加以下行
  "loader": "forge:obj",
  "flip_v": true,
  "model": "examplemod:models/block/model.obj",
  "textures": {
    // 在 .mtl 中可用 #texture0 引用
    "texture0": "minecraft:block/dirt",
    "particle": "minecraft:block/dirt"
  }
}
```

