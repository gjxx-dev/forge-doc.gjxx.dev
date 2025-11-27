# 模型生成

可以为模型与方块状态生成相应的 JSON。每种提供者都会生成对应的 JSON（模型使用 `ModelBuilder#toJson`，方块状态使用 `IGeneratedBlockState#toJson`）。实现后需将相应的提供者通过 `DataGenerator#addProvider` 添加到生成器中。

```java
// 在 MOD 事件总线上
@SubscribeEvent
public void gatherData(GatherDataEvent event) {
    DataGenerator gen = event.getGenerator();
    ExistingFileHelper efh = event.getExistingFileHelper();

    gen.addProvider(
        // 仅在生成客户端资源时运行
        event.includeClient(),
        output -> new MyItemModelProvider(output, MOD_ID, efh)
    );
    gen.addProvider(
        event.includeClient(),
        output -> new MyBlockStateProvider(output, MOD_ID, efh)
    );
}
```

模型文件
---------
`ModelFile` 表示模型的基类，用于引用或生成模型。每个 `ModelFile` 存储相对于 `models` 子目录的位置，并可校验文件是否存在。

### 已存在的模型文件（Existing Model Files）
`ExistingModelFile` 继承自 `ModelFile`，会通过 [`ExistingFileHelper#exists`][efh] 检查模型是否已存在。非生成的模型通常以 `ExistingModelFile` 引用。

### 未校验的模型文件（Unchecked Model Files）
`UncheckedModelFile` 假定指定的模型在某处存在，但不会进行存在性校验。

!!! note
    正常情况下不应使用 `UncheckedModelFile` 来引用模型；若出现，说明相关资源未被 `ExistingFileHelper` 正确跟踪。

模型构建器（Model Builders）
-----------------------------
`ModelBuilder` 代表一个待生成的模型，包含模型的父文件、面（faces）、纹理、变换、光照等信息。生成器会在创建 builder 时将其加入到 `ModelProvider` 的生成队列中。

每个元素（element）由两个三维点定义（`ElementBuilder#from` 与 `#to`），每个轴的取值范围为 `[-16,32]`。每个面的配置可包括剔除面（`cullface`）、染色索引（`tintindex`）、纹理引用（`texture`）、UV 坐标 (`uvs`) 以及 90 度倍数的旋转 (`rotation`) 等。

注意: 若模型元素任一轴超出 `[0,16]`，建议拆分为多个方块以避免光照与剔除问题。

模型也支持围绕指定点旋转（`RotationBuilder#origin`）与按角度（22.5 度步长）旋转（`RotationBuilder#angle`），并可设置是否缩放法线（`rescale`）与是否启用阴影（`shade`）。

纹理键（texture keys）可指向 `assets/<namespace>/textures/<path>.png` 的具体位置，或作为父模型被子模型引用的占位键（reference），并以 `#key` 的形式在元素中使用。

此外，模型可设置不同视角下的变换（Transforms），例如第一人称左手、GUI、地面等，对每种视角可设置旋转、平移与缩放。

### `BlockModelBuilder`
表示要生成的方块模型，除 `ModelBuilder` 属性外还支持根变换（`rootTransform`），可对整个模型进行平移、旋转与缩放。

### `ItemModelBuilder`
表示要生成的物品模型，支持生成覆盖（overrides），每个覆盖可基于某些属性（predicate）判断是否显示替代模型。

模型提供者（Model Providers）
-----------------------------
`ModelProvider` 的子类负责生成 `ModelBuilder` 并写出模型文件。提供者接收生成器、模组 id、要生成的 `models` 子目录、`ModelBuilder` 工厂与 `ExistingFileHelper`，并必须实现 `#registerModels`。

提供者包含一些便捷方法来创建 `ModelBuilder` 或获得纹理/模型引用，例如 `getBuilder`、`withExistingParent`、`mcLoc` 与 `modLoc` 等。

此外还有若干帮助函数，用于快速生成基于原版模板的常见模型。

### `BlockModelProvider` 与 `ItemModelProvider`
`BlockModelProvider` 用于在 `models/block` 生成方块模型；`ItemModelProvider` 用于在 `models/item` 生成物品模型。通常通过 `BlockStateProvider` 来组合生成 blockstate 与模型。

模型加载器构建器与自定义加载器等更高级主题也被支持（参见原文以了解全部 API 细节）。

[efh]: ../index.md#existing-files
[provider]: #model-providers
[models]: ../../resources/client/models/index.md
[datagen]: ../index.md#data-providers
[overrides]: ../../resources/client/models/itemproperties.md
[color]: ../../resources/client/models/tinting.md#blockcoloritemcolor
[blockstateprovider]: #block-state-provider
[blockstate]: https://minecraft.wiki/w/Tutorials/Models#Block_states
[obj]: ../../rendering/modelloaders/index.md#wavefront-obj-models